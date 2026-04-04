import { Request, Response, NextFunction } from 'express';
import { UserRole } from './models';
import { database } from './database';

// Mock JWT verification - in production, would validate Okta tokens
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    authSubjectId: string;
  };
}

// JWT token structure
interface DecodedToken {
  sub: string; // auth subject id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Mock JWT parser - expects Authorization: Bearer <token> header
// In production, would validate against Okta tenant
export function extractBearerToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Mock token decoder - for MVP, assumes token is JSON-encoded
// Production: validate signature with Okta public key
export function decodeToken(token: string): DecodedToken | null {
  try {
    const buffer = Buffer.from(token, 'base64');
    const decoded = JSON.parse(buffer.toString());
    return decoded;
  } catch {
    return null;
  }
}

// Middleware to attach user info to request
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req);
    
    if (!token) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Ensure authenticated principals exist in users for FK-safe audit logging.
    const now = new Date().toISOString();
    const existing = await database.get(
      'SELECT id FROM users WHERE auth_subject_id = ? OR email = ? LIMIT 1',
      [decoded.sub, decoded.email]
    );

    const userId = existing?.id || decoded.sub;

    if (!existing) {
      await database.run(
        `INSERT INTO users (id, email, display_name, role, auth_subject_id, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [userId, decoded.email, decoded.email, decoded.role, decoded.sub, now, now]
      );
    } else {
      await database.run(
        `UPDATE users
         SET email = ?, role = ?, auth_subject_id = ?, updated_at = ?
         WHERE id = ?`,
        [decoded.email, decoded.role, decoded.sub, now, userId]
      );
    }

    // Attach user to request
    req.user = {
      id: userId,
      email: decoded.email,
      role: decoded.role,
      authSubjectId: decoded.sub
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Authorization checks
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action' });
      return;
    }

    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'Admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

export function requireWriter(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (!['Admin', 'Contract Manager'].includes(req.user.role)) {
    res.status(403).json({ error: 'Write access required' });
    return;
  }

  next();
}
