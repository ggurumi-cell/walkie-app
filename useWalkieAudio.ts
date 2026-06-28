import { useEffect, useRef, useState, useCallback } from "react";
import { RealtimeChannel, createClient } from "@supabase/supabase-js";

const BROADCAST_CHANNEL = "walkie-broadcast-all"; // 전체통화 채널
const NOTIFY_CHANNEL = "walkie-notify-global";     // 자동 채널 전환용

interface AudioStreamConfig {
  channelName: string;
  userId: number;
  userName: string;
  onReceiveAudio?: (data: { senderName: string; audioChunk: ArrayBuffer }) => void;
  onStateChange?: (state: "idle" | "transmitting" | "receiving") => void;
  onIncomingCall?: (senderName: string, senderId: number) => void;
  onBroadcastStart?: (senderName: string) => void;
  onBroadcastEnd?: () => void;
}

// 통화 로그 저장 (Supabase)
async function saveCallLog(supabase: any, entry: {
  sender_id: number;
  sender_name: string;
  receiver_id: number | null;
  is_broadcast: boolean;
  started_at: string;
}) {
  try {
    await supabase.from("walkie_call_logs").insert(entry);
  } catch (e) {
    console.warn("[Walkie] 로그 저장 실패:", e);
  }
}

export function useWalkieAudio(config: AudioStreamConfig) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivingFrom, setReceivingFrom] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);
  const notifyChannelRef = useRef<RealtimeChannel | null>(null);
  const workletNodeRef = useRef<ScriptProcessorNode | null>(null);
  const isTransmittingRef = useRef(false);
  const callStartTimeRef = useRef<string | null>(null);

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

  const sendAudioChunk = useCallback((audioData: Float32Array, targetChannel: RealtimeChannel | null) => {
    if (!isTransmittingRef.current || !targetChannel) return;
    targetChannel.send({
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

  const startTransmitting = useCallback(async (isBroadcast = false) => {
    if (isTransmittingRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      mediaStreamRef.current = stream;
      const audioContext = await getAudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      const targetChannel = isBroadcast ? broadcastChannelRef.current : channelRef.current;

      processor.onaudioprocess = (e) => {
        if (!isTransmittingRef.current) return;
        const data = e.inputBuffer.getChannelData(0);
        sendAudioChunk(new Float32Array(data), targetChannel);
      };

      source.connect(processor);
      // destination 연결 제거 - 에코 방지
      workletNodeRef.current = processor;

      isTransmittingRef.current = true;
      setIsTransmitting(true);
      callStartTimeRef.current = new Date().toISOString();
      config.onStateChange?.("transmitting");

      const eventPayload = {
        senderName: config.userName,
        senderId: config.userId,
        isBroadcast,
      };

      if (isBroadcast) {
        broadcastChannelRef.current?.send({
          type: "broadcast", event: "transmit_start", payload: eventPayload,
        });
      } else {
        // 개별통화: 수신자에게 자동 채널 전환 신호
        channelRef.current?.send({
          type: "broadcast", event: "transmit_start", payload: eventPayload,
        });
      }
    } catch (err) {
      console.error("[Walkie] 마이크 오류:", err);
      alert("마이크 권한이 필요합니다.");
    }
  }, [config, getAudioContext, sendAudioChunk]);

  const stopTransmitting = useCallback((isBroadcast = false) => {
    isTransmittingRef.current = false;
    setIsTransmitting(false);

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    const eventPayload = { senderName: config.userName, senderId: config.userId };
    if (isBroadcast) {
      broadcastChannelRef.current?.send({
        type: "broadcast", event: "transmit_end", payload: eventPayload,
      });
    } else {
      channelRef.current?.send({
        type: "broadcast", event: "transmit_end", payload: eventPayload,
      });
    }

    config.onStateChange?.("idle");
  }, [config]);

  // 개별 채널 구독
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const channel = supabase.channel(config.channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "audio_chunk" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        const audioData = new Float32Array(p.audioChunk);
        playAudioChunk(audioData, p.sampleRate || 44100);
        config.onReceiveAudio?.({ senderName: p.senderName, audioChunk: audioData.buffer });
      })
      .on("broadcast", { event: "transmit_start" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        setIsReceiving(true);
        setReceivingFrom(p.senderName);
        config.onStateChange?.("receiving");
        config.onIncomingCall?.(p.senderName, p.senderId);
      })
      .on("broadcast", { event: "transmit_end" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
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
      .on("broadcast", { event: "audio_chunk" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        const audioData = new Float32Array(p.audioChunk);
        playAudioChunk(audioData, p.sampleRate || 44100);
      })
      .on("broadcast", { event: "transmit_start" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
        setIsReceiving(true);
        setReceivingFrom(p.senderName);
        config.onStateChange?.("receiving");
        config.onBroadcastStart?.(p.senderName);
      })
      .on("broadcast", { event: "transmit_end" }, (payload: any) => {
        const p = payload.payload;
        if (p.senderId === config.userId) return;
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
    notifyChannel: notifyChannelRef,
  };
}
