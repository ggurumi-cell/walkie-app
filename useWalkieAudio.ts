import { useEffect, useRef, useState, useCallback } from "react";
import { RealtimeChannel, createClient } from "@supabase/supabase-js";

interface AudioStreamConfig {
  channelName: string;
  userId: number;
  userName: string;
  onReceiveAudio?: (data: { senderName: string; audioChunk: ArrayBuffer }) => void;
  onStateChange?: (state: "idle" | "transmitting" | "receiving") => void;
}

export function useWalkieAudio(config: AudioStreamConfig) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivingFrom, setReceivingFrom] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);

  // ✅ 수정 핵심: ref로 isTransmitting 추적 (클로저 버그 방지)
  const isTransmittingRef = useRef(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const sendAudioChunk = useCallback((audioData: Float32Array) => {
    if (!isTransmittingRef.current) return;
    if (!channelRef.current) return;

    // Float32Array → 일반 배열로 변환해서 전송
    channelRef.current.send({
      type: "broadcast",
      event: "audio_chunk",
      payload: {
        senderName: config.userName,
        senderId: config.userId,
        audioChunk: Array.from(audioData),
        sampleRate: audioContextRef.current?.sampleRate || 44100,
        timestamp: Date.now(),
      },
    });
  }, [config.userName, config.userId]);

  const playAudioChunk = useCallback(async (audioData: Float32Array, sampleRate: number) => {
    try {
      const audioContext = await getAudioContext();
      const buffer = audioContext.createBuffer(1, audioData.length, sampleRate);
      buffer.getChannelData(0).set(audioData);

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (err) {
      console.error("[Walkie] 오디오 재생 오류:", err);
    }
  }, [getAudioContext]);

  const startTransmitting = useCallback(async () => {
    if (isTransmittingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // 낮은 샘플레이트로 데이터량 감소
        },
      });

      mediaStreamRef.current = stream;
      const audioContext = await getAudioContext();
      const source = audioContext.createMediaStreamSource(stream);

      // ✅ ScriptProcessorNode 사용 (모바일 호환성 최대화)
      const processor = audioContext.createScriptProcessor(2048, 1, 1);

      processor.onaudioprocess = (e) => {
        // ✅ ref를 통해 최신 상태 참조 (클로저 버그 수정)
        if (!isTransmittingRef.current) return;
        const data = e.inputBuffer.getChannelData(0);
        sendAudioChunk(new Float32Array(data));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      workletNodeRef.current = processor;

      // ✅ ref와 state 동시 업데이트
      isTransmittingRef.current = true;
      setIsTransmitting(true);
      config.onStateChange?.("transmitting");

      // 송신 시작 알림
      channelRef.current?.send({
        type: "broadcast",
        event: "transmit_start",
        payload: { senderName: config.userName, senderId: config.userId },
      });

    } catch (err) {
      console.error("[Walkie] 마이크 오류:", err);
      alert("마이크 권한이 필요합니다. 브라우저에서 마이크 접근을 허용해주세요.");
    }
  }, [config, getAudioContext, sendAudioChunk]);

  const stopTransmitting = useCallback(() => {
    // ✅ ref 먼저 false로 설정 (onaudioprocess 즉시 중단)
    isTransmittingRef.current = false;
    setIsTransmitting(false);

    // 마이크 스트림 중지
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    // 프로세서 연결 해제
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    // 송신 종료 알림
    channelRef.current?.send({
      type: "broadcast",
      event: "transmit_end",
      payload: { senderName: config.userName, senderId: config.userId },
    });

    config.onStateChange?.("idle");
  }, [config]);

  // ✅ 핵심 수정: 채널명 대칭화 (두 사용자가 같은 채널 구독)
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) {
      console.warn("[Walkie] Supabase 환경변수가 설정되지 않았습니다.");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ✅ 채널명을 ID 정렬로 통일 (A-B = B-A 동일 채널)
    const channelName = config.channelName;

    console.log("[Walkie] 채널 구독 시작:", channelName);

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "audio_chunk" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return; // 내 것은 무시
        const audioData = new Float32Array(p.audioChunk);
        playAudioChunk(audioData, p.sampleRate || 44100);
        config.onReceiveAudio?.({
          senderName: p.senderName,
          audioChunk: audioData.buffer,
        });
      })
      .on("broadcast", { event: "transmit_start" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        console.log("[Walkie] 수신 시작:", p.senderName);
        setIsReceiving(true);
        setReceivingFrom(p.senderName);
        config.onStateChange?.("receiving");
      })
      .on("broadcast", { event: "transmit_end" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        console.log("[Walkie] 수신 종료");
        setIsReceiving(false);
        setReceivingFrom(null);
        config.onStateChange?.("idle");
      })
      .subscribe((status) => {
        console.log("[Walkie] 채널 상태:", status);
      });

    channelRef.current = channel;

    return () => {
      console.log("[Walkie] 채널 구독 해제:", channelName);
      channel.unsubscribe();
    };
  }, [config.channelName, config.userId]);

  return {
    isTransmitting,
    isReceiving,
    receivingFrom,
    startTransmitting,
    stopTransmitting,
  };
}
