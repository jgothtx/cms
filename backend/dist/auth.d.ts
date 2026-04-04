import { Request, Response, NextFunction } from 'express';
import { UserRole } from './models';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        authSubjectId: string;
    };
}
interface DecodedToken {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export declare function extractBearerToken(req: AuthRequest): string | null;
export declare function decodeToken(token: string): DecodedToken | null;
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requireRole(...allowedRoles: UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireWriter(req: AuthRequest, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=auth.d.ts.map