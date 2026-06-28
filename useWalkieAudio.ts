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
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const isBroadcastingRef = useRef(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        
      });
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    try {
      const audioContext = await getAudioContext();
      const audioData = audioQueueRef.current.shift()!;
      const buffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate);
      buffer.getChannelData(0).set(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        playNextInQueue();
      };
      source.start(0);
    } catch (err) {
      console.error("[Walkie] ?ъ깮 ?ㅻ쪟:", err);
      isPlayingRef.current = false;
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

      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = "highpass";
      highPassFilter.frequency.value = 80;

      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = "lowpass";
      lowPassFilter.frequency.value = 8000;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const targetChannel = isBroadcast ? broadcastChannelRef.current : channelRef.current;

      processor.onaudioprocess = (e) => {
        if (!isTransmittingRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const maxVal = Math.max(...Array.from(inputData).map(Math.abs));
        if (maxVal < 0.01) return;

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
            timestamp: Date.now(),
          },
        });
      };

      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(processor);
      

      processorRef.current = processor;
      isTransmittingRef.current = true;
      isBroadcastingRef.current = isBroadcast;
      setIsTransmitting(true);
      config.onStateChange?.("transmitting");

      targetChannel?.send({
        type: "broadcast",
        event: "transmit_start",
        payload: {
          senderName: config.userName,
          senderId: config.userId,
          isBroadcast,
        },
      });
    } catch (err) {
      console.error("[Walkie] 留덉씠???ㅻ쪟:", err);
      alert("留덉씠??沅뚰븳???꾩슂?⑸땲??");
    }
  }, [config, getAudioContext]);

  const stopTransmitting = useCallback((isBroadcast = false) => {
    isTransmittingRef.current = false;
    isBroadcastingRef.current = false;
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

  // 媛쒕퀎 梨꾨꼸 援щ룆
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

        if (isTransmittingRef.current) {
          stopTransmitting();
        }

        const int16 = new Int16Array(p.audioData);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768;
        }
        audioQueueRef.current.push(float32);
        playNextInQueue();
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

  // ?꾩껜?듯솕 梨꾨꼸 援щ룆
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
        const int16 = new Int16Array(p.audioData);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768;
        }
        audioQueueRef.current.push(float32);
        playNextInQueue();
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

  // ?먮룞 梨꾨꼸 ?꾪솚???꾩뿭 ?뚮┝ 梨꾨꼸
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
