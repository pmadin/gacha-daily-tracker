import express, { Request, Response, Router } from 'express';
import database from '../../config/database';
import { requireAdmin, ROLES, getRoleName } from '../../middleware/admin';
import '../../middleware/auth';

const roleRouter: Router = express.Router();

/**
 * @swagger
 * /gdt/admin/users/role/{username}:
 *   patch:
 *     summary: Update user role by username (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to modify
 *         example: "test_userROLE1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newRole:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 description: "1=User, 2=Premium, 3=Admin, 4=Owner"
 *               reason:
 *                 type: string
 *                 description: Reason for role change
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
roleRouter.patch('/users/role/:username', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const { newRole, reason } = req.body;
        const adminUser = req.user!;

        // Validation
        if (!newRole || ![1, 2, 3, 4].includes(newRole)) {
            return res.status(400).json({
                error: 'Invalid role. Must be 1 (User), 2 (Premium), 3 (Admin), or 4 (Owner)'
            });
        }

        // Owner protection: Only owners can create other owners
        if (newRole === ROLES.OWNER && adminUser.role < ROLES.OWNER) {
            return res.status(403).json({
                error: 'Only owners can assign owner role'
            });
        }

        // Admin protection: Only owners can promote to admin
        if (newRole === ROLES.ADMIN && adminUser.role < ROLES.OWNER) {
            return res.status(403).json({
                error: 'Only owners can assign admin role'
            });
        }

        // Get target user by username
        const targetUserResult = await database.query(
            'SELECT id, username, email, role FROM users WHERE username = $1',
            [username]
        );

        if (targetUserResult.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                username: username
            });
        }

        const targetUser = targetUserResult.rows[0];

        // Prevent self-demotion for owners
        if (targetUser.id === adminUser.userId && adminUser.role === ROLES.OWNER && newRole < ROLES.OWNER) {
            return res.status(403).json({
                error: 'You cannot demote yourself from owner role'
            });
        }

        // Prevent demoting other owners (only owners can demote owners)
        if (targetUser.role === ROLES.OWNER && adminUser.role < ROLES.OWNER) {
            return res.status(403).json({
                error: 'Only owners can modify other owners'
            });
        }

        // Update role
        await database.query(
            'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newRole, targetUser.id]
        );

        // Log the role change
        console.log(`🔐 Role changed by ${adminUser.username}: ${targetUser.username} (${targetUser.email}) from role ${targetUser.role} to ${newRole}. Reason: ${reason || 'No reason provided'}`);

        res.json({
            message: 'Role updated successfully',
            user: {
                id: targetUser.id,
                username: targetUser.username,
                email: targetUser.email,
                oldRole: targetUser.role,
                newRole: newRole,
                oldRoleName: getRoleName(targetUser.role),
                newRoleName: getRoleName(newRole)
            },
            changedBy: adminUser.username,
            reason: reason || 'No reason provided',
            timestamp: new Date().toISOString()
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Role update error:', errorMessage);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

/**
 * @swagger
 * /gdt/admin/users:
 *   get:
 *     summary: List all users with roles (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4]
 *         description: Filter by role (optional)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username or email (optional)
 *     responses:
 *       200:
 *         description: List of all users with role information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: integer
 *                       roleName:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 requestedBy:
 *                   type: string
 */
roleRouter.get('/users', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { role, search } = req.query;

        let query = `
            SELECT id, username, email, role, first_name, last_name, 
                   timezone, created_at, updated_at
            FROM users 
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        // Add role filter
        if (role) {
            query += ` AND role = $${paramIndex}`;
            params.push(parseInt(role as string));
            paramIndex++;
        }

        // Add search filter
        if (search) {
            query += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY role DESC, created_at DESC`;

        const usersResult = await database.query(query, params);

        const users = usersResult.rows.map(user => ({
            ...user,
            roleName: getRoleName(user.role),
            // Don't expose password_hash or sensitive info
            password_hash: undefined
        }));

        res.json({
            users,
            total: users.length,
            requestedBy: req.user!.username,
            filters: {
                role: role || 'all',
                search: search || 'none'
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Users list error:', errorMessage);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * @swagger
 * /gdt/admin/users/search:
 *   get:
 *     summary: Search users by username or email (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for username or email
 *         example: "test"
 *     responses:
 *       200:
 *         description: Search results
 */
roleRouter.get('/users/search', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.status(400).json({
                error: 'Search query must be at least 2 characters long'
            });
        }

        const searchResult = await database.query(`
            SELECT id, username, email, role, first_name, last_name, created_at
            FROM users 
            WHERE username ILIKE $1 OR email ILIKE $1
            ORDER BY 
                CASE WHEN username = $2 THEN 1 ELSE 2 END,
                username
            LIMIT 20
        `, [`%${q}%`, q]);

        const users = searchResult.rows.map(user => ({
            ...user,
            roleName: getRoleName(user.role)
        }));

        res.json({
            users,
            searchTerm: q,
            total: users.length,
            requestedBy: req.user!.username
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('User search error:', errorMessage);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

export { roleRouter };