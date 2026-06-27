import { useEffect, useRef, useState, useCallback } from "react";

interface SimpleAudioConfig {
  userId: number;
  userName: string;
  onStateChange?: (state: "idle" | "transmitting" | "receiving") => void;
  onGroupCallReceived?: (groupName: string) => void;
  onIncomingCallAttempt?: (senderName: string) => void;
}

/**
 * 로컬 상태 관리 기반의 간소화된 무전 오디오 훅
 * 실제 배포 시에는 Supabase Realtime으로 교체됨
 */
export function useSimpleWalkieAudio(config: SimpleAudioConfig) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivingFrom, setReceivingFrom] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // AudioContext 초기화
  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) return audioContextRef.current;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      return audioContextRef.current;
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
      return null;
    }
  }, []);

  // 마이크 입력 시작
  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const audioContext = await initAudioContext();
      if (!audioContext) return;

      // ScriptProcessorNode를 사용하여 오디오 청크 캡처
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        if (isTransmitting) {
          // 실제 배포 시: Supabase Broadcast로 전송
          // 현재: 로컬 상태만 유지
          const audioData = event.inputBuffer.getChannelData(0);
          console.log("[Audio] Capturing chunk:", audioData.length, "samples");
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      processorRef.current = processor;
    } catch (error) {
      console.error("Failed to start microphone:", error);
    }
  }, [isTransmitting, initAudioContext]);

  // 마이크 입력 중지
  const stopMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
  }, []);

  // 송신 시작
  const startTransmitting = useCallback(async () => {
    setIsTransmitting(true);
    config.onStateChange?.("transmitting");
    await startMicrophone();
    console.log(`[Walkie] ${config.userName} started transmitting`);
  }, [config, startMicrophone]);

  // 송신 중지
  const stopTransmitting = useCallback(() => {
    setIsTransmitting(false);
    stopMicrophone();
    config.onStateChange?.("idle");
    console.log(`[Walkie] ${config.userName} stopped transmitting`);
  }, [config, stopMicrophone]);

  // 수신 시뮬레이션 (테스트용)
  const simulateReceiving = useCallback((senderName: string) => {
    setIsReceiving(true);
    setReceivingFrom(senderName);
    config.onStateChange?.("receiving");
  }, [config]);

  // 수신 중지 시뮬레이션
  const stopReceiving = useCallback(() => {
    setIsReceiving(false);
    setReceivingFrom(null);
    config.onStateChange?.("idle");
  }, [config]);

  // 정리
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, [stopMicrophone]);

  // 그룹 무전 수신 시뮬레이션
  const simulateGroupCallReceived = useCallback((groupName: string) => {
    console.log(`[Walkie] Group call received from: ${groupName}`);
    config.onGroupCallReceived?.(groupName);
  }, [config]);

  return {
    isTransmitting,
    isReceiving,
    receivingFrom,
    startTransmitting,
    stopTransmitting,
    simulateReceiving,
    stopReceiving,
    simulateGroupCallReceived,
  };
}
