import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import database from '../config/database';

// Role Enums for consistency
export const ROLES = {
    USER: 1,
    PREMIUM: 2,
    ADMIN: 3,
    OWNER: 4
} as const;

/**
 * Middleware to require admin or owner privileges
 * Performs JWT verification + database role cross-check for security
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Verify JWT token exists
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Admin access required',
                hint: 'Include "Authorization: Bearer <token>" header with admin privileges'
            });
        }

        const token = authHeader.substring(7);

        // 2. Verify JWT signature and decode
        let decoded: any;
        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'fallback-secret-change-in-production'
            );
        } catch (jwtError) {
            return res.status(401).json({
                error: 'Invalid or expired admin token',
                hint: 'Please login again with an admin account'
            });
        }

        // 3. CRITICAL: Double-check role in database for security
        const userResult = await database.query(
            'SELECT id, username, email, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Admin user not found' });
        }

        const user = userResult.rows[0];

        // 4. Compare JWT role with DB role (security check)
        if (decoded.role !== user.role) {
            console.warn(`Role mismatch detected! JWT: ${decoded.role}, DB: ${user.role} for user ${user.username}`);
            return res.status(401).json({
                error: 'Token invalid. Please login again.',
                reason: 'Role verification failed'
            });
        }

        // 5. Check admin privileges (3 = Admin, 4 = Owner)
        if (user.role < ROLES.ADMIN) {
            return res.status(403).json({
                error: 'Admin privileges required',
                currentRole: user.role,
                currentRoleName: getRoleName(user.role),
                requiredRole: ROLES.ADMIN,
                requiredRoleName: 'Admin or Owner'
            });
        }

        // 6. Attach user info to request (use DB data, not JWT data)
        req.user = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        };

        next();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Admin middleware error:', errorMessage);
        return res.status(500).json({
            error: 'Admin authentication failed',
            details: errorMessage
        });
    }
};

/**
 * Middleware to require owner privileges only
 */
export const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // First run admin check
        await new Promise<void>((resolve, reject) => {
            requireAdmin(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Then check if owner specifically
        if (req.user!.role < ROLES.OWNER) {
            return res.status(403).json({
                error: 'Owner privileges required',
                currentRole: req.user!.role,
                currentRoleName: getRoleName(req.user!.role),
                requiredRole: ROLES.OWNER,
                requiredRoleName: 'Owner'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Owner authentication failed' });
    }
};

/**
 * Helper function to get role name from role number
 */
export const getRoleName = (role: number): string => {
    const roleNames = {
        1: 'User',
        2: 'Premium User',
        3: 'Admin',
        4: 'Owner'
    };
    return roleNames[role as keyof typeof roleNames] || 'Unknown';
};

/**
 * Helper function to check if user has minimum role
 */
export const hasMinimumRole = (userRole: number, requiredRole: number): boolean => {
    return userRole >= requiredRole;
};