import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

export type Role = "patient" | "clinician" | "admin";
export type Session = { id: string; role: Role };

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET must be set (16+ characters)");
  return s;
};

export const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 8,
};

export const sign = (s: Session) => jwt.sign(s, secret(), { expiresIn: "8h" });

export function requireAuth(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const s = jwt.verify(req.cookies?.token ?? "", secret()) as Session;
      if (roles.length && !roles.includes(s.role)) return res.status(403).json({ error: "Not allowed" });
      res.locals.session = s;
      next();
    } catch {
      res.status(401).json({ error: "Please sign in" });
    }
  };
}
