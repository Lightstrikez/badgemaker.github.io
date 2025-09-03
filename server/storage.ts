import {
  users,
  badges,
  badgeApplications,
  evidence,
  type User,
  type InsertUser,
  type Badge,
  type InsertBadge,
  type BadgeApplication,
  type InsertBadgeApplication,
  type Evidence,
  type InsertEvidence,
  type GraduateProfile,
  type BadgeStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Badge methods
  getAllBadges(): Promise<Badge[]>;
  getBadgesByGraduateProfile(profile: GraduateProfile): Promise<Badge[]>;
  getBadge(id: string): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: string, badge: Partial<InsertBadge>): Promise<Badge | undefined>;

  // Badge Application methods
  getUserApplications(userId: string): Promise<(BadgeApplication & { badge: Badge; evidence: Evidence[] })[]>;
  getApplication(id: string): Promise<(BadgeApplication & { badge: Badge; user: User; evidence: Evidence[] }) | undefined>;
  createApplication(application: InsertBadgeApplication): Promise<BadgeApplication>;
  updateApplicationStatus(id: string, status: BadgeStatus, reviewedBy?: string, feedback?: string): Promise<BadgeApplication | undefined>;
  getApplicationsForReview(): Promise<(BadgeApplication & { badge: Badge; user: User })[]>;

  // Evidence methods
  getApplicationEvidence(applicationId: string): Promise<Evidence[]>;
  createEvidence(evidence: InsertEvidence): Promise<Evidence>;
  deleteEvidence(id: string): Promise<boolean>;

  // Stats methods
  getUserStats(userId: string): Promise<{
    earnedBadges: number;
    inProgress: number;
    totalBadges: number;
    completionRate: number;
  }>;
  getGraduateProfileProgress(userId: string): Promise<{
    profile: GraduateProfile;
    earnedCount: number;
    totalCount: number;
    percentage: number;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.isActive, true)).orderBy(badges.graduateProfile, badges.level);
  }

  async getBadgesByGraduateProfile(profile: GraduateProfile): Promise<Badge[]> {
    return await db.select().from(badges)
      .where(and(eq(badges.graduateProfile, profile), eq(badges.isActive, true)))
      .orderBy(badges.level);
  }

  async getBadge(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge || undefined;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async updateBadge(id: string, badge: Partial<InsertBadge>): Promise<Badge | undefined> {
    const [updatedBadge] = await db.update(badges).set(badge).where(eq(badges.id, id)).returning();
    return updatedBadge || undefined;
  }

  async getUserApplications(userId: string): Promise<(BadgeApplication & { badge: Badge; evidence: Evidence[] })[]> {
    const applications = await db.select()
      .from(badgeApplications)
      .leftJoin(badges, eq(badgeApplications.badgeId, badges.id))
      .leftJoin(evidence, eq(badgeApplications.id, evidence.applicationId))
      .where(eq(badgeApplications.userId, userId))
      .orderBy(desc(badgeApplications.createdAt));

    const groupedApplications = applications.reduce((acc, row) => {
      const appId = row.badge_applications.id;
      if (!acc[appId]) {
        acc[appId] = {
          ...row.badge_applications,
          badge: row.badges!,
          evidence: []
        };
      }
      if (row.evidence) {
        acc[appId].evidence.push(row.evidence);
      }
      return acc;
    }, {} as Record<string, BadgeApplication & { badge: Badge; evidence: Evidence[] }>);

    return Object.values(groupedApplications);
  }

  async getApplication(id: string): Promise<(BadgeApplication & { badge: Badge; user: User; evidence: Evidence[] }) | undefined> {
    const applicationData = await db.select()
      .from(badgeApplications)
      .leftJoin(badges, eq(badgeApplications.badgeId, badges.id))
      .leftJoin(users, eq(badgeApplications.userId, users.id))
      .leftJoin(evidence, eq(badgeApplications.id, evidence.applicationId))
      .where(eq(badgeApplications.id, id));

    if (applicationData.length === 0) return undefined;

    const application = applicationData[0].badge_applications;
    const badge = applicationData[0].badges!;
    const user = applicationData[0].users!;
    const evidenceList = applicationData.filter(row => row.evidence).map(row => row.evidence!);

    return {
      ...application,
      badge,
      user,
      evidence: evidenceList
    };
  }

  async createApplication(application: InsertBadgeApplication): Promise<BadgeApplication> {
    const [newApplication] = await db.insert(badgeApplications).values(application).returning();
    return newApplication;
  }

  async updateApplicationStatus(id: string, status: BadgeStatus, reviewedBy?: string, feedback?: string): Promise<BadgeApplication | undefined> {
    const updateData: any = { status };
    if (status === 'submitted') {
      updateData.submittedAt = new Date();
    }
    if (status === 'earned' || status === 'rejected') {
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = reviewedBy;
      updateData.feedback = feedback;
    }

    const [updatedApplication] = await db.update(badgeApplications)
      .set(updateData)
      .where(eq(badgeApplications.id, id))
      .returning();
    return updatedApplication || undefined;
  }

  async getApplicationsForReview(): Promise<(BadgeApplication & { badge: Badge; user: User })[]> {
    const applications = await db.select()
      .from(badgeApplications)
      .leftJoin(badges, eq(badgeApplications.badgeId, badges.id))
      .leftJoin(users, eq(badgeApplications.userId, users.id))
      .where(eq(badgeApplications.status, 'submitted'))
      .orderBy(desc(badgeApplications.submittedAt));

    return applications.map(row => ({
      ...row.badge_applications,
      badge: row.badges!,
      user: row.users!
    }));
  }

  async getApplicationEvidence(applicationId: string): Promise<Evidence[]> {
    return await db.select().from(evidence)
      .where(eq(evidence.applicationId, applicationId))
      .orderBy(desc(evidence.createdAt));
  }

  async createEvidence(evidenceData: InsertEvidence): Promise<Evidence> {
    const [newEvidence] = await db.insert(evidence).values(evidenceData).returning();
    return newEvidence;
  }

  async deleteEvidence(id: string): Promise<boolean> {
    const result = await db.delete(evidence).where(eq(evidence.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUserStats(userId: string): Promise<{
    earnedBadges: number;
    inProgress: number;
    totalBadges: number;
    completionRate: number;
  }> {
    const [earnedResult] = await db.select({ count: count() })
      .from(badgeApplications)
      .where(and(eq(badgeApplications.userId, userId), eq(badgeApplications.status, 'earned')));

    const [inProgressResult] = await db.select({ count: count() })
      .from(badgeApplications)
      .where(and(
        eq(badgeApplications.userId, userId),
        sql`${badgeApplications.status} IN ('in_progress', 'submitted', 'in_review')`
      ));

    const [totalResult] = await db.select({ count: count() })
      .from(badges)
      .where(eq(badges.isActive, true));

    const earnedBadges = earnedResult.count;
    const inProgress = inProgressResult.count;
    const totalBadges = totalResult.count;
    const completionRate = totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0;

    return {
      earnedBadges,
      inProgress,
      totalBadges,
      completionRate
    };
  }

  async getGraduateProfileProgress(userId: string): Promise<{
    profile: GraduateProfile;
    earnedCount: number;
    totalCount: number;
    percentage: number;
  }[]> {
    const profiles: GraduateProfile[] = ['excellence', 'innovation', 'integrity', 'inspiration', 'hauora', 'relationships'];
    const result = [];

    for (const profile of profiles) {
      const [earnedResult] = await db.select({ count: count() })
        .from(badgeApplications)
        .leftJoin(badges, eq(badgeApplications.badgeId, badges.id))
        .where(and(
          eq(badgeApplications.userId, userId),
          eq(badgeApplications.status, 'earned'),
          eq(badges.graduateProfile, profile)
        ));

      const [totalResult] = await db.select({ count: count() })
        .from(badges)
        .where(and(eq(badges.graduateProfile, profile), eq(badges.isActive, true)));

      const earnedCount = earnedResult.count;
      const totalCount = totalResult.count;
      const percentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

      result.push({
        profile,
        earnedCount,
        totalCount,
        percentage
      });
    }

    return result;
  }
}

export const storage = new DatabaseStorage();
