import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { assessmentsRouter } from "./routes/assessments.js";
import { adminRouter } from "./routes/admin.js";

export const app = express();
app.set("trust proxy", 1); // correct client IPs for rate limiting behind Vercel/Render
app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.AUTH_RATE_LIMIT ?? 50) }), authRouter);
app.use("/api/assessments", assessmentsRouter);
app.use("/api/admin", adminRouter);
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Express 5 forwards async errors here. Never leak internals to the client.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError) return res.status(400).json({ error: "Invalid JSON" });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side" });
});
