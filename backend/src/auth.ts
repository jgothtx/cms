import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserBySubject, createUser } from './repositories';
import type { AuthUser } from './models';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(payload: { sub: string; name: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Dev mode: allow X-User-Role header for testing
  if (!authHeader && process.env.NODE_ENV !== 'production') {
    const role = (req.headers['x-user-role'] as string) || 'Admin';
    const userId = (req.headers['x-user-id'] as string) || 'dev-user';
    req.user = { id: userId, role: role as AuthUser['role'], display_name: 'Dev User', email: 'dev@example.com' };
    return next();
  }

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Auto-provision user
    let user = findUserBySubject(decoded.sub);
    if (!user) {
      user = createUser({
        auth_subject_id: decoded.sub,
        display_name: decoded.name || decoded.email || 'Unknown',
        email: decoded.email || '',
        role: decoded.role || 'Viewer',
      });
    }

    req.user = { id: user.id, role: user.role, display_name: user.display_name, email: user.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requireWriter(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role === 'Viewer') {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
