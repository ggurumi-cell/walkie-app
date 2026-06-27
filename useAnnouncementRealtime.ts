import { useEffect, useState, useCallback } from "react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  senderName: string;
  priority: "normal" | "urgent";
  createdAt: Date;
}

interface UseAnnouncementRealtimeProps {
  onNewAnnouncement?: (announcement: Announcement) => void;
  onAnnouncementDeleted?: (id: number) => void;
}

/**
 * 공지사항 실시간 수신 훅
 * 로컬 시뮬레이션 모드에서 동작하며, Supabase 연동 시 Realtime 채널로 전환 가능
 */
export function useAnnouncementRealtime({
  onNewAnnouncement,
  onAnnouncementDeleted,
}: UseAnnouncementRealtimeProps) {
  const [isConnected, setIsConnected] = useState(true);

  // 로컬 시뮬레이션: 전역 함수로 공지 수신 시뮬레이션
  useEffect(() => {
    const handleSimulateAnnouncement = (announcement: Announcement) => {
      onNewAnnouncement?.(announcement);
    };

    // 전역 함수 등록
    (window as any).__handleAnnouncementReceived = handleSimulateAnnouncement;

    return () => {
      delete (window as any).__handleAnnouncementReceived;
    };
  }, [onNewAnnouncement]);

  return {
    isConnected,
    broadcastAnnouncement: (announcement: Announcement) => {
      // 로컬 시뮬레이션: 모든 리스너에게 공지 브로드캐스트
      if ((window as any).__handleAnnouncementReceived) {
        (window as any).__handleAnnouncementReceived(announcement);
      }
    },
  };
}

/**
 * 공지 브로드캐스트 시뮬레이션 (개발자 콘솔용)
 * 사용법: __broadcastAnnouncement({title: "...", content: "...", ...})
 */
export function setupAnnouncementSimulation() {
  (window as any).__broadcastAnnouncement = (announcement: Partial<Announcement>) => {
    const fullAnnouncement: Announcement = {
      id: Date.now(),
      title: announcement.title || "공지",
      content: announcement.content || "",
      senderName: announcement.senderName || "시스템",
      priority: announcement.priority || "normal",
      createdAt: new Date(),
    };

    if ((window as any).__handleAnnouncementReceived) {
      (window as any).__handleAnnouncementReceived(fullAnnouncement);
    }

    console.log("[Announcement] 브로드캐스트:", fullAnnouncement);
  };

  console.log(
    "[Announcement] 시뮬레이션 준비 완료. 콘솔에서 __broadcastAnnouncement() 호출 가능"
  );
}

/**
 * Supabase Realtime 연동용 훅 (향후 구현)
 * 
 * 사용 예시:
 * ```typescript
 * const { isConnected, broadcastAnnouncement } = useAnnouncementRealtime({
 *   onNewAnnouncement: (announcement) => {
 *     // 공지 수신 처리
 *   }
 * });
 * ```
 */
export function useSupabaseAnnouncementRealtime({
  onNewAnnouncement,
}: UseAnnouncementRealtimeProps) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Supabase 클라이언트 초기화 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 필요)
    // const supabase = createClient(
    //   import.meta.env.VITE_SUPABASE_URL,
    //   import.meta.env.VITE_SUPABASE_ANON_KEY
    // );

    // 공지 채널 구독
    // const channel = supabase.channel("announcements");
    // channel
    //   .on(
    //     "broadcast",
    //     { event: "new_announcement" },
    //     (payload) => {
    //       onNewAnnouncement?.(payload.payload);
    //     }
    //   )
    //   .subscribe((status) => {
    //     setIsConnected(status === "SUBSCRIBED");
    //   });

    // return () => {
    //   channel.unsubscribe();
    // };
  }, [onNewAnnouncement]);

  return {
    isConnected,
    broadcastAnnouncement: async (announcement: Announcement) => {
      // Supabase Realtime 브로드캐스트
      // await supabase.channel("announcements").send({
      //   type: "broadcast",
      //   event: "new_announcement",
      //   payload: announcement,
      // });
    },
  };
}
