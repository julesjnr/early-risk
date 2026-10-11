import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { assessments, users } from "../db/schema.js";
import { requireAuth, type Session } from "../auth.js";
import { assess, inputSchema } from "../scoring.js";

export const assessmentsRouter = Router();

// Patients: create an assessment (scored on the server, then stored)
assessmentsRouter.post("/", requireAuth(), async (req, res) => {
  const p = inputSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Some answers are missing or out of range", issues: p.error.issues });
  const s = res.locals.session as Session;
  const results = assess(p.data);
  const [row] = await db.insert(assessments).values({ userId: s.id, input: p.data, results }).returning();
  res.status(201).json(row);
});

// Own history
assessmentsRouter.get("/", requireAuth(), async (_req, res) => {
  const s = res.locals.session as Session;
  const rows = await db.select().from(assessments).where(eq(assessments.userId, s.id)).orderBy(desc(assessments.createdAt));
  res.json(rows);
});

// Clinician / admin review: recent assessments with patient name
assessmentsRouter.get("/review", requireAuth("clinician", "admin"), async (_req, res) => {
  const rows = await db
    .select({ id: assessments.id, createdAt: assessments.createdAt, results: assessments.results, patient: users.name, email: users.email })
    .from(assessments)
    .innerJoin(users, eq(users.id, assessments.userId))
    .orderBy(desc(assessments.createdAt))
    .limit(100);
  res.json(rows);
});
