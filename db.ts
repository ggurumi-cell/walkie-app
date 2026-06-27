import { eq, and, desc, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, walkieUsers, walkieGroups, walkieGroupMembers, walkieAnnouncements, InsertWalkieAnnouncement } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Walkie-Talkie 앱 관련 쿼리 헬퍼들

export async function getWalkieUserByEmployeeIdAndAuthCode(employeeId: string, authCode: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get walkie user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(walkieUsers)
    .where(and(eq(walkieUsers.employeeId, employeeId), eq(walkieUsers.authCode, authCode), eq(walkieUsers.isActive, 1)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllWalkieUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get walkie users: database not available");
    return [];
  }

  return await db.select().from(walkieUsers).where(eq(walkieUsers.isActive, 1));
}

export async function getWalkieGroups() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get walkie groups: database not available");
    return [];
  }

  return await db.select().from(walkieGroups);
}

export async function getGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get group members: database not available");
    return [];
  }

  return await db.select().from(walkieGroupMembers).where(eq(walkieGroupMembers.groupId, groupId));
}

// 공지사항 관련 쿼리 헬퍼

export async function createAnnouncement(announcement: InsertWalkieAnnouncement) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create announcement: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(walkieAnnouncements).values(announcement);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create announcement:", error);
    throw error;
  }
}

export async function getAnnouncementsByDate(date: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get announcements: database not available");
    return [];
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await db
    .select()
    .from(walkieAnnouncements)
    .where(and(gte(walkieAnnouncements.createdAt, startOfDay)))
    .orderBy(desc(walkieAnnouncements.createdAt));
}

export async function getAllAnnouncements() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get announcements: database not available");
    return [];
  }

  return await db.select().from(walkieAnnouncements).orderBy(desc(walkieAnnouncements.createdAt));
}

export async function deleteAnnouncementsBefore(date: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete announcements: database not available");
    return;
  }

  try {
    // date 이전의 공지사항 삭제
    await db.delete(walkieAnnouncements).where(gte(walkieAnnouncements.createdAt, date));
  } catch (error) {
    console.error("[Database] Failed to delete announcements:", error);
    throw error;
  }
}
