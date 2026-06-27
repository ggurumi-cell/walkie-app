import { useCallback, useRef, useEffect } from "react";

interface BusyVoiceConfig {
  enabled?: boolean;
  language?: "ko" | "en";
}

/**
 * 통화 중 음성 안내 훅
 * 무전 중일 때 다른 사용자의 무전 시도에 "통화 중입니다" 음성 안내를 제공합니다.
 */
export function useBusyVoiceNotification(config: BusyVoiceConfig = {}) {
  const { enabled = true, language = "ko" } = config;
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isPlayingRef = useRef(false);

  // SpeechSynthesis API 초기화
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // 음성 안내 메시지
  const getBusyMessage = useCallback(() => {
    switch (language) {
      case "en":
        return "The line is busy. Please try again later.";
      case "ko":
      default:
        return "통화 중입니다.";
    }
  }, [language]);

  // 음성 안내 재생
  const playBusyVoice = useCallback(async () => {
    if (!enabled || !synthRef.current || isPlayingRef.current) {
      return;
    }

    try {
      isPlayingRef.current = true;

      // 기존 음성 중단
      synthRef.current.cancel();

      // 음성 생성
      const utterance = new SpeechSynthesisUtterance(getBusyMessage());

      // 음성 설정
      utterance.lang = language === "ko" ? "ko-KR" : "en-US";
      utterance.rate = 1.0; // 정상 속도
      utterance.pitch = 1.0; // 정상 음높이
      utterance.volume = 1.0; // 최대 볼륨

      // 재생 완료 콜백
      utterance.onend = () => {
        isPlayingRef.current = false;
      };

      // 에러 콜백
      utterance.onerror = (event) => {
        console.error("[BusyVoice] Error:", event.error);
        isPlayingRef.current = false;
      };

      // 음성 재생
      synthRef.current.speak(utterance);

      console.log("[BusyVoice] Playing busy voice notification");
    } catch (error) {
      console.error("[BusyVoice] Failed to play voice:", error);
      isPlayingRef.current = false;
    }
  }, [enabled, getBusyMessage, language]);

  // 음성 중단
  const stopBusyVoice = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      isPlayingRef.current = false;
    }
  }, []);

  // 정리
  useEffect(() => {
    return () => {
      stopBusyVoice();
    };
  }, [stopBusyVoice]);

  return {
    playBusyVoice,
    stopBusyVoice,
    isPlaying: isPlayingRef.current,
    busyMessage: getBusyMessage(),
  };
}
