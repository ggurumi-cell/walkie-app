import { describe, it, expect } from "vitest";
import {
  createAnnouncement,
  getAnnouncementsByDate,
  getAllAnnouncements,
} from "./db";

describe("Walkie-Talkie Announcements", () => {
  it("should create an announcement", async () => {
    const result = await createAnnouncement({
      title: "긴급 공지",
      content: "모든 직원에게 긴급 공지입니다.",
      senderId: 1,
      senderName: "관리자",
      priority: "urgent",
    });

    expect(result).toBeDefined();
  });

  it("should retrieve announcements for today", async () => {
    // 테스트용 공지 생성
    await createAnnouncement({
      title: "오늘의 공지",
      content: "오늘 업무 공지입니다.",
      senderId: 1,
      senderName: "관리자",
      priority: "normal",
    });

    const announcements = await getAnnouncementsByDate(new Date());
    expect(Array.isArray(announcements)).toBe(true);
  });

  it("should retrieve all announcements", async () => {
    const announcements = await getAllAnnouncements();
    expect(Array.isArray(announcements)).toBe(true);
  });

  it("should handle announcement with urgent priority", async () => {
    const result = await createAnnouncement({
      title: "긴급 - 시스템 점검",
      content: "오늘 오후 2시부터 시스템 점검이 있습니다.",
      senderId: 1,
      senderName: "IT팀",
      priority: "urgent",
    });

    expect(result).toBeDefined();
  });

  it("should handle announcement with normal priority", async () => {
    const result = await createAnnouncement({
      title: "일반 공지",
      content: "일반 업무 공지입니다.",
      senderId: 2,
      senderName: "인사팀",
      priority: "normal",
    });

    expect(result).toBeDefined();
  });
});
