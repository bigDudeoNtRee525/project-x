import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../lib/supabase';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  const user = await verifyAuthToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // Attach user to request
  req.user = {
    id: user.id,
    email: user.email!,
  };

  next();
}

// Optional middleware for routes that can work with or without authentication
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No user attached
  }

  const token = authHeader.substring(7);
  const user = await verifyAuthToken(token);

  if (user) {
    req.user = {
      id: user.id,
      email: user.email!,
    };
  }

  next();
}