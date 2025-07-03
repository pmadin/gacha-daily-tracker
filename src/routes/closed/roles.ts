import express, { Request, Response, Router } from 'express';
import database from '../../config/database';
import { requireAdmin, ROLES, getRoleName } from '../../middleware/admin';

const roleRouter: Router = express.Router();

/**
 * @swagger
 * /gdt/admin/users/role/{userId}:
 *   patch:
 *     summary: Update user role (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
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
 */
roleRouter.patch('/users/:userId/role', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
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

        // Get target user
        const targetUserResult = await database.query(
            'SELECT id, username, email, role FROM users WHERE id = $1',
            [userId]
        );

        if (targetUserResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const targetUser = targetUserResult.rows[0];

        // Prevent demoting other owners (only owners can demote owners)
        if (targetUser.role === ROLES.OWNER && adminUser.role < ROLES.OWNER) {
            return res.status(403).json({
                error: 'Only owners can modify other owners'
            });
        }

        // Update role
        await database.query(
            'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newRole, userId]
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
 *     summary: List all users (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
roleRouter.get('/users', requireAdmin, async (req: Request, res: Response) => {
    try {
        const usersResult = await database.query(`
            SELECT id, username, email, role, first_name, last_name,
                   timezone, created_at, updated_at
            FROM users
            ORDER BY role DESC, created_at DESC
        `);

        const users = usersResult.rows.map(user => ({
            ...user,
            roleName: getRoleName(user.role)
        }));

        res.json({
            users,
            total: users.length,
            requestedBy: req.user!.username
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Users list error:', errorMessage);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export { roleRouter };