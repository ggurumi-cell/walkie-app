import { useEffect } from "react";

interface UseAutoDeleteAnnouncementsProps {
  onMidnightReached: () => void;
}

/**
 * 자정(00:00)이 되면 로컬 공지사항을 자동으로 삭제하는 훅
 * 사용자의 기기 시간 기준으로 매일 자정에 실행된다.
 */
export function useAutoDeleteAnnouncements({
  onMidnightReached,
}: UseAutoDeleteAnnouncementsProps) {
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setDate(nextMidnight.getDate() + 1);
      nextMidnight.setHours(0, 0, 0, 0);

      const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

      // 자정까지 남은 시간 후 콜백 실행
      const timer = setTimeout(() => {
        onMidnightReached();
        // 자정 이후 다시 체크 시작
        checkMidnight();
      }, timeUntilMidnight);

      return () => clearTimeout(timer);
    };

    return checkMidnight();
  }, [onMidnightReached]);
}

/**
 * localStorage에서 공지사항을 삭제하는 유틸리티 함수
 */
export function clearAnnouncementsFromStorage() {
  try {
    localStorage.removeItem("walkie_announcements");
    localStorage.removeItem("walkie_announcements_timeline");
    console.log("[Auto-Delete] 공지사항이 자정 기준으로 삭제되었습니다.");
  } catch (error) {
    console.error("[Auto-Delete] 공지사항 삭제 중 오류 발생:", error);
  }
}

/**
 * localStorage에 공지사항을 저장하는 유틸리티 함수
 */
export function saveAnnouncementToStorage(announcement: any) {
  try {
    const existing = JSON.parse(
      localStorage.getItem("walkie_announcements_timeline") || "[]"
    );
    existing.push({
      ...announcement,
      createdAt: new Date(announcement.createdAt).toISOString(),
    });
    localStorage.setItem(
      "walkie_announcements_timeline",
      JSON.stringify(existing)
    );
  } catch (error) {
    console.error("[Storage] 공지사항 저장 중 오류 발생:", error);
  }
}

/**
 * localStorage에서 공지사항을 조회하는 유틸리티 함수
 */
export function getAnnouncementsFromStorage() {
  try {
    const stored = localStorage.getItem("walkie_announcements_timeline");
    if (!stored) return [];
    const announcements = JSON.parse(stored);
    return announcements.map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt),
    }));
  } catch (error) {
    console.error("[Storage] 공지사항 조회 중 오류 발생:", error);
    return [];
  }
}
