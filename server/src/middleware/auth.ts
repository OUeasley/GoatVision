import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/auth'; // Import Lucia instance
import type { Session, User } from "lucia";

// Augment Express Request type to include Lucia session/user
declare global {
  namespace Express {
    interface Request {
      session: Session | null;
      user: User | null;
    }
  }
}

// Middleware to validate Lucia session
export const luciaAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = auth.readSessionCookie(req.headers.cookie ?? "");
  if (!sessionId) {
    req.user = null;
    req.session = null;
    return next();
  }

  const { session, user } = await auth.validateSession(sessionId);

  if (session && session.fresh) {
    // Session needs refreshing (e.g., expiration extended)
    const sessionCookie = auth.createSessionCookie(session.id);
    res.appendHeader("Set-Cookie", sessionCookie.serialize());
  }
  if (!session) {
    // Invalid session ID, clear the cookie
    const sessionCookie = auth.createBlankSessionCookie();
    res.appendHeader("Set-Cookie", sessionCookie.serialize());
  }

  req.user = user;
  req.session = session;
  return next();
};

// Middleware to require authentication
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}; 