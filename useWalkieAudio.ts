import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

interface AudioStreamConfig {
  channelName: string;
  userId: number;
  userName: string;
  onStateChange?: (state: "idle" | "transmitting" | "receiving") => void;
  onIncomingCall?: (senderName: string, senderId: number) => void;
  onBroadcastStart?: (senderName: string) => void;
  onBroadcastEnd?: () => void;
}

const BROADCAST_CHANNEL = "walkie-broadcast-all";
const NOTIFY_CHANNEL = "walkie-notify-global";

export function useWalkieAudio(config: AudioStreamConfig) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivingFrom, setReceivingFrom] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const broadcastChannelRef = useRef<any>(null);
  const notifyChannelRef = useRef<any>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isTransmittingRef = useRef(false);
  const isReceivingRef = useRef(false);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

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

  // 스케줄링 방식으로 끊김 없이 재생
  const scheduleAudio = useCallback(async (float32: Float32Array) => {
    try {
      const audioContext = await getAudioContext();
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, float32.length, sampleRate);
      buffer.getChannelData(0).set(float32);

      const source = audioContext.createBufferSource();

      // 다이나믹 컴프레서 - 음량 균일하게
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      source.buffer = buffer;
      source.connect(compressor);
      compressor.connect(audioContext.destination);

      // 현재 시간보다 뒤처졌으면 즉시 재생
      const now = audioContext.currentTime;
      if (nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now + 0.05; // 50ms 버퍼
      }

      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;
    } catch (err) {
      console.error("[Walkie] 재생 오류:", err);
    }
  }, [getAudioContext]);

  const startTransmitting = useCallback(async (isBroadcast = false) => {
    if (isTransmittingRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      mediaStreamRef.current = stream;
      const audioContext = await getAudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      const targetChannel = isBroadcast ? broadcastChannelRef.current : channelRef.current;

      processor.onaudioprocess = (e) => {
        if (!isTransmittingRef.current) return;
        if (isReceivingRef.current) return; // 수신 중 마이크 차단

        const inputData = e.inputBuffer.getChannelData(0);
        const maxVal = Math.max(...Array.from(inputData).map(Math.abs));
        if (maxVal < 0.015) return; // 노이즈 게이트

        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }

        targetChannel?.send({
          type: "broadcast",
          event: "audio_chunk",
          payload: {
            senderName: config.userName,
            senderId: config.userId,
            audioData: Array.from(int16),
            sampleRate: audioContext.sampleRate,
            timestamp: Date.now(),
          },
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      processorRef.current = processor;
      isTransmittingRef.current = true;
      setIsTransmitting(true);
      config.onStateChange?.("transmitting");

      targetChannel?.send({
        type: "broadcast",
        event: "transmit_start",
        payload: { senderName: config.userName, senderId: config.userId, isBroadcast },
      });
    } catch (err) {
      console.error("[Walkie] 마이크 오류:", err);
      alert("마이크 권한이 필요합니다.");
    }
  }, [config, getAudioContext]);

  const stopTransmitting = useCallback((isBroadcast = false) => {
    isTransmittingRef.current = false;
    setIsTransmitting(false);

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    const targetChannel = isBroadcast ? broadcastChannelRef.current : channelRef.current;
    targetChannel?.send({
      type: "broadcast",
      event: "transmit_end",
      payload: { senderName: config.userName, senderId: config.userId },
    });

    config.onStateChange?.("idle");
  }, [config]);

  const handleAudioChunk = useCallback((p: any) => {
    if (p.senderId === config.userId) return;
    const int16 = new Int16Array(p.audioData);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    scheduleAudio(float32);
  }, [config.userId, scheduleAudio]);

  // 개별 채널 구독
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const channel = supabase.channel(config.channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "audio_chunk" }, (payload: any) => handleAudioChunk(payload.payload))
      .on("broadcast", { event: "transmit_start" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        isReceivingRef.current = true;
        nextPlayTimeRef.current = 0;
        setIsReceiving(true);
        setReceivingFrom(p.senderName);
        config.onStateChange?.("receiving");
        config.onIncomingCall?.(p.senderName, p.senderId);
      })
      .on("broadcast", { event: "transmit_end" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        isReceivingRef.current = false;
        setIsReceiving(false);
        setReceivingFrom(null);
        config.onStateChange?.("idle");
      })
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [config.channelName, config.userId]);

  // 전체통화 채널 구독
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const bch = supabase.channel(BROADCAST_CHANNEL, {
      config: { broadcast: { self: false } },
    });

    bch
      .on("broadcast", { event: "audio_chunk" }, (payload: any) => handleAudioChunk(payload.payload))
      .on("broadcast", { event: "transmit_start" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        isReceivingRef.current = true;
        nextPlayTimeRef.current = 0;
        setIsReceiving(true);
        setReceivingFrom(p.senderName);
        config.onStateChange?.("receiving");
        config.onBroadcastStart?.(p.senderName);
      })
      .on("broadcast", { event: "transmit_end" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        isReceivingRef.current = false;
        setIsReceiving(false);
        setReceivingFrom(null);
        config.onStateChange?.("idle");
        config.onBroadcastEnd?.();
      })
      .subscribe();

    broadcastChannelRef.current = bch;
    return () => { bch.unsubscribe(); };
  }, [config.userId]);

  // 자동 채널 전환용 전역 알림 채널
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const nch = supabase.channel(NOTIFY_CHANNEL, {
      config: { broadcast: { self: false } },
    });

    nch
      .on("broadcast", { event: "call_request" }, (payload: any) => {
        const p = payload.payload;
        if (p.targetId !== config.userId) return;
        config.onIncomingCall?.(p.senderName, p.senderId);
      })
      .subscribe();

    notifyChannelRef.current = nch;
    return () => { nch.unsubscribe(); };
  }, [config.userId]);

  return {
    isTransmitting,
    isReceiving,
    receivingFrom,
    startTransmitting,
    stopTransmitting,
  };
}
