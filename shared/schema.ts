import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const graduateProfileEnum = pgEnum('graduate_profile', [
  'excellence',
  'innovation', 
  'integrity',
  'inspiration',
  'hauora',
  'relationships'
]);

export const badgeStatusEnum = pgEnum('badge_status', [
  'not_started',
  'in_progress',
  'submitted',
  'in_review',
  'earned',
  'rejected'
]);

export const evidenceTypeEnum = pgEnum('evidence_type', [
  'written_reflection',
  'file_upload',
  'project_link',
  'video_submission'
]);

export const userRoleEnum = pgEnum('user_role', [
  'student',
  'teacher',
  'admin'
]);

// Tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  criteria: text("criteria").notNull(),
  graduateProfile: graduateProfileEnum("graduate_profile").notNull(),
  level: integer("level").notNull(), // 1, 2, 3 for different difficulty levels
  requiredEvidenceCount: integer("required_evidence_count").notNull().default(3),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const badgeApplications = pgTable("badge_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  status: badgeStatusEnum("status").notNull().default('not_started'),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const evidence = pgTable("evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => badgeApplications.id),
  type: evidenceTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"), // For written reflections
  fileUrl: text("file_url"), // For file uploads
  metadata: jsonb("metadata"), // Additional data like file size, type, etc.
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(badgeApplications),
  reviewedApplications: many(badgeApplications, { relationName: "reviewer" })
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  applications: many(badgeApplications)
}));

export const badgeApplicationsRelations = relations(badgeApplications, ({ one, many }) => ({
  user: one(users, {
    fields: [badgeApplications.userId],
    references: [users.id]
  }),
  badge: one(badges, {
    fields: [badgeApplications.badgeId],
    references: [badges.id]
  }),
  reviewer: one(users, {
    fields: [badgeApplications.reviewedBy],
    references: [users.id],
    relationName: "reviewer"
  }),
  evidence: many(evidence)
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  application: one(badgeApplications, {
    fields: [evidence.applicationId],
    references: [badgeApplications.id]
  })
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true
});

export const insertBadgeApplicationSchema = createInsertSchema(badgeApplications).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
  reviewedAt: true
});

export const insertEvidenceSchema = createInsertSchema(evidence).omit({
  id: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type BadgeApplication = typeof badgeApplications.$inferSelect;
export type InsertBadgeApplication = z.infer<typeof insertBadgeApplicationSchema>;

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;

export type GraduateProfile = typeof graduateProfileEnum.enumValues[number];
export type BadgeStatus = typeof badgeStatusEnum.enumValues[number];
export type EvidenceType = typeof evidenceTypeEnum.enumValues[number];
export type UserRole = typeof userRoleEnum.enumValues[number];
