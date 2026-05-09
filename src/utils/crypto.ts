import crypto from 'crypto';

const pepper = process.env.PASSWORD_PEPPER;
if (!pepper) throw new Error('PASSWORD_PEPPER environment variable is required');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');

export const JWT_SECRET: string = jwtSecret;

export function addPepper(password: string): string {
    return crypto.createHmac('sha256', pepper!).update(password).digest('hex');
}
