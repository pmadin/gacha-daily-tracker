import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                email: string;
                username: string;
            };
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Access denied. No token provided.',
            hint: 'Include "Authorization: Bearer <token>" header'
        });
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const decoded = jwt.verify(token, secret) as any;

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            username: decoded.username
        };

        next();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid token';

        if (errorMessage.includes('expired')) {
            return res.status(401).json({
                error: 'Token expired. Please login again.'
            });
        }

        return res.status(403).json({
            error: 'Invalid token.'
        });
    }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // No token provided, continue without authentication
        return next();
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const decoded = jwt.verify(token, secret) as any;

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            username: decoded.username
        };
    } catch (error) {
        // Invalid token, but continue anyway (optional auth)
        console.warn('Invalid token in optional auth:', error);
    }

    next();
};