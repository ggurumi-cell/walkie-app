import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Walkie-Talkie 앱 사용자 테이블
 * 사전 등록된 60명의 직원 정보를 저장한다.
 * 이름(또는 사번)과 인증번호로 로그인한다.
 */
export const walkieUsers = mysqlTable("walkie_users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  employeeId: varchar("employeeId", { length: 50 }).notNull().unique(),
  authCode: varchar("authCode", { length: 50 }).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WalkieUser = typeof walkieUsers.$inferSelect;
export type InsertWalkieUser = typeof walkieUsers.$inferInsert;

/**
 * 그룹 무전 테이블
 * 여러 사용자가 함께 무전할 수 있는 그룹을 정의한다.
 */
export const walkieGroups = mysqlTable("walkie_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WalkieGroup = typeof walkieGroups.$inferSelect;
export type InsertWalkieGroup = typeof walkieGroups.$inferInsert;

/**
 * 그룹 멤버 테이블
 * 각 그룹에 속한 사용자들을 정의한다.
 */
export const walkieGroupMembers = mysqlTable("walkie_group_members", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalkieGroupMember = typeof walkieGroupMembers.$inferSelect;
export type InsertWalkieGroupMember = typeof walkieGroupMembers.$inferInsert;

/**
 * 실시간 공지사항 테이블
 * 관리자가 전체 사용자에게 보내는 공지사항을 저장한다.
 */
export const walkieAnnouncements = mysqlTable("walkie_announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  senderId: int("senderId").notNull(),
  senderName: varchar("senderName", { length: 100 }).notNull(),
  priority: mysqlEnum("priority", ["normal", "urgent"]).default("normal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type WalkieAnnouncement = typeof walkieAnnouncements.$inferSelect;
export type InsertWalkieAnnouncement = typeof walkieAnnouncements.$inferInsert;
