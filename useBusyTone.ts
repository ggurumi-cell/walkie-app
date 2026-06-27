import { useCallback, useRef, useEffect } from "react";

/**
 * "삐" 음 신호(Busy Tone) 생성 훅
 * Web Audio API를 사용하여 통화 중 신호음을 생성합니다.
 * 
 * 특징:
 * - 1000Hz 사인파 + 1400Hz 사인파 조합
 * - 500ms 음, 500ms 침묵 반복
 * - 자동으로 2초 후 종료
 */
export function useBusyTone() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainsRef = useRef<GainNode[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AudioContext 초기화
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;

    try {
      audioContextRef.current =
        new (window.AudioContext || (window as any).webkitAudioContext)();
      return audioContextRef.current;
    } catch (error) {
      console.error("[BusyTone] Failed to initialize AudioContext:", error);
      return null;
    }
  }, []);

  // "삐" 음 신호 재생
  const playBusyTone = useCallback(async () => {
    const audioContext = initAudioContext();
    if (!audioContext) {
      console.warn("[BusyTone] AudioContext not available");
      return;
    }

    try {
      // 기존 오실레이터 정리
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch (e) {
          // 이미 정지된 경우 무시
        }
      });
      oscillatorsRef.current = [];
      gainsRef.current = [];

      // 현재 시간
      const now = audioContext.currentTime;

      // 1000Hz 오실레이터
      const osc1 = audioContext.createOscillator();
      osc1.frequency.value = 1000;
      osc1.type = "sine";

      // 1400Hz 오실레이터
      const osc2 = audioContext.createOscillator();
      osc2.frequency.value = 1400;
      osc2.type = "sine";

      // 게인 노드 (음량 제어)
      const gain1 = audioContext.createGain();
      const gain2 = audioContext.createGain();
      const masterGain = audioContext.createGain();

      // 음량 설정 (0.3 = 30%)
      gain1.gain.value = 0.15;
      gain2.gain.value = 0.15;
      masterGain.gain.value = 0.5;

      // 연결
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(masterGain);
      gain2.connect(masterGain);
      masterGain.connect(audioContext.destination);

      // 시작
      osc1.start(now);
      osc2.start(now);

      // 500ms 음, 500ms 침묵 패턴
      // 첫 번째 "삐" (0-500ms)
      masterGain.gain.setValueAtTime(0.5, now);
      masterGain.gain.setValueAtTime(0, now + 0.5);

      // 두 번째 "삐" (1000-1500ms)
      masterGain.gain.setValueAtTime(0.5, now + 1.0);
      masterGain.gain.setValueAtTime(0, now + 1.5);

      // 세 번째 "삐" (2000-2500ms)
      masterGain.gain.setValueAtTime(0.5, now + 2.0);
      masterGain.gain.setValueAtTime(0, now + 2.5);

      // 2.5초 후 정지
      osc1.stop(now + 2.5);
      osc2.stop(now + 2.5);

      oscillatorsRef.current = [osc1, osc2];
      gainsRef.current = [gain1, gain2, masterGain];

      console.log("[BusyTone] Playing busy tone signal");

      // 2.5초 후 자동 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        oscillatorsRef.current = [];
        gainsRef.current = [];
      }, 2500);
    } catch (error) {
      console.error("[BusyTone] Error playing busy tone:", error);
    }
  }, [initAudioContext]);

  // 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch (e) {
          // 이미 정지된 경우 무시
        }
      });
    };
  }, []);

  return {
    playBusyTone,
  };
}
