import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { cookieOpts, requireAuth, sign, type Session } from "../auth.js";

export const authRouter = Router();

const creds = z.object({ email: z.string().email().toLowerCase(), password: z.string().min(8).max(128) });

authRouter.post("/register", async (req, res) => {
  const p = creds.extend({ name: z.string().min(1).max(100) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Enter a name, a valid email and a password of 8+ characters" });
  const exists = await db.query.users.findFirst({ where: eq(users.email, p.data.email) });
  if (exists) return res.status(409).json({ error: "That email is already registered" });
  const [u] = await db
    .insert(users)
    .values({ email: p.data.email, name: p.data.name, passwordHash: await bcrypt.hash(p.data.password, 12) })
    .returning();
  res.cookie("token", sign({ id: u.id, role: u.role }), cookieOpts);
  res.status(201).json({ id: u.id, name: u.name, role: u.role });
});

authRouter.post("/login", async (req, res) => {
  const p = creds.safeParse(req.body);
  const u = p.success ? await db.query.users.findFirst({ where: eq(users.email, p.data.email) }) : undefined;
  if (!p.success || !u || !(await bcrypt.compare(p.data.password, u.passwordHash)))
    return res.status(401).json({ error: "Email or password is incorrect" });
  res.cookie("token", sign({ id: u.id, role: u.role }), cookieOpts);
  res.json({ id: u.id, name: u.name, role: u.role });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token", cookieOpts);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth(), async (_req, res) => {
  const s = res.locals.session as Session;
  const u = await db.query.users.findFirst({ where: eq(users.id, s.id) });
  if (!u) return res.status(401).json({ error: "Please sign in" });
  res.json({ id: u.id, name: u.name, role: u.role });
});
