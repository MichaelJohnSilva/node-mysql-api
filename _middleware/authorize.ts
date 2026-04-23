import { Request, Response, NextFunction, Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.json';
import db from '../_helpers/db';
import { Role } from '../_helpers/role';

type RoleType = typeof Role[keyof typeof Role];

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
                ownsToken: (token: string) => boolean;
            };
        }
    }
}

export function authorize(roles: RoleType[] = []) {
    const middleware = Router();

    middleware.use(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, config.secret) as { id: string };

            const account = await db.Account.findByPk(decoded.id);
            if (!account) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const accountRole = account.role as RoleType;
            if (roles.length && !roles.includes(accountRole)) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            req.user = {
                id: account.id,
                role: accountRole,
                ownsToken: (token: string) => {
                    const payload = jwt.verify(token, config.secret) as { id: string };
                    return payload.id === account.id;
                }
            };

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    });

    return middleware;
}
