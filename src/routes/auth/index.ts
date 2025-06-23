import express, { Router } from 'express';
import { registerRouter } from './register';
import { loginRouter } from './login';

const authRoutes: Router = express.Router();

// Combine all auth routes
authRoutes.use(registerRouter);
authRoutes.use(loginRouter);

export { authRoutes };