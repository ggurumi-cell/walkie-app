import { useEffect, useRef } from "react";

interface WaveAnimationProps {
  isActive: boolean;
  state: "transmitting" | "receiving" | "idle";
}

/**
 * 오디오 송수신 상태를 시각적으로 표현하는 파동 애니메이션 컴포넌트
 * - transmitting: 초록색 파동 (송신 중)
 * - receiving: 파란색 파동 (수신 중)
 * - idle: 회색 파동 (대기 중)
 */
export default function WaveAnimation({
  isActive,
  state,
}: WaveAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // 상태에 따른 색상 결정
  const getColor = (): { primary: string; secondary: string } => {
    switch (state) {
      case "transmitting":
        return { primary: "#10b981", secondary: "#6ee7b7" }; // 초록색
      case "receiving":
        return { primary: "#3b82f6", secondary: "#93c5fd" }; // 파란색
      default:
        return { primary: "#9ca3af", secondary: "#d1d5db" }; // 회색
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas 크기 설정
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    const animate = () => {
      if (!isActive) {
        // 비활성 상태: 정적 파동
        ctx.clearRect(0, 0, width, height);
        const color = getColor();
        ctx.strokeStyle = color.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, centerY, 20, 0, Math.PI * 2);
        ctx.stroke();
        return;
      }

      // 활성 상태: 애니메이션 파동
      ctx.clearRect(0, 0, width, height);
      const color = getColor();

      // 여러 개의 파동 그리기 (3개)
      for (let i = 0; i < 3; i++) {
        const radius = 20 + i * 15;
        const opacity = 1 - (timeRef.current % 1000) / 1000;
        const scale = 1 + (timeRef.current % 1000) / 1000;

        ctx.strokeStyle = color.primary;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, centerY, radius * scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 중심 원 그리기
      ctx.globalAlpha = 1;
      ctx.fillStyle = color.primary;
      ctx.beginPath();
      ctx.arc(width / 2, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      timeRef.current += 50;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, state]);

  return (
    <canvas
      ref={canvasRef}
      width={100}
      height={100}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
