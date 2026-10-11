import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["patient", "clinician", "admin"] }).notNull().default("patient"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  input: jsonb("input").notNull(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
