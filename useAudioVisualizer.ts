import { useEffect, useRef } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface UseAudioVisualizerConfig {
  isActive: boolean;
  state: "transmitting" | "receiving" | "idle";
}

/**
 * 오디오 송수신 상태를 기반으로 비주얼라이저 데이터를 제공하는 훅
 * Canvas에서 실시간 오디오 파형을 그릴 때 사용
 */
export function useAudioVisualizer(config: UseAudioVisualizerConfig) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!config.isActive) return;

    // AudioContext 초기화
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Analyser 노드 생성
    if (!analyserRef.current) {
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }

    return () => {
      // Cleanup
    };
  }, [config.isActive]);

  // 현재 오디오 데이터 가져오기
  const getFrequencyData = (): Uint8Array | null => {
    if (!analyserRef.current || !dataArrayRef.current) return null;
    const data = dataArrayRef.current as any;
    analyserRef.current.getByteFrequencyData(data);
    return data;
  };

  // 평균 주파수 값 계산
  const getAverageFrequency = (): number => {
    const data = getFrequencyData();
    if (!data) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length;
  };

  return {
    getFrequencyData,
    getAverageFrequency,
    analyser: analyserRef.current,
    isActive: config.isActive,
    state: config.state,
  };
}
