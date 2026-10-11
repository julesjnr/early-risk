import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { requireAuth, type Session } from "../auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth("admin"));

adminRouter.get("/users", async (_req, res) => {
  res.json(await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users));
});

adminRouter.patch("/users/:id/role", async (req, res) => {
  const p = z.object({ role: z.enum(["patient", "clinician", "admin"]) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid role" });
  if ((res.locals.session as Session).id === req.params.id) return res.status(400).json({ error: "You can't change your own role" });
  const [u] = await db.update(users).set({ role: p.data.role }).where(eq(users.id, req.params.id)).returning({ id: users.id, role: users.role });
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json(u);
});
