import { useEffect, useRef, useState, useCallback } from "react";

interface GroupPriorityConfig {
  onGroupCallReceived?: (groupName: string) => void;
  onReturnToIndividual?: () => void;
}

/**
 * 그룹 무전 우선순위 관리 훅
 * 개별 무전 중 그룹 무전이 오면 자동으로 개별 무전을 중단하고 그룹 무전을 우선 처리
 */
export function useGroupPriority(config: GroupPriorityConfig) {
  const [isGroupCallActive, setIsGroupCallActive] = useState(false);
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null);
  const [wasIndividualCallActive, setWasIndividualCallActive] = useState(false);
  const groupCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 그룹 무전 수신 시작
  const receiveGroupCall = useCallback((groupName: string) => {
    console.log(`[GroupPriority] Receiving group call from: ${groupName}`);
    
    setIsGroupCallActive(true);
    setActiveGroupName(groupName);
    
    // 콜백 실행
    config.onGroupCallReceived?.(groupName);
  }, [config]);

  // 그룹 무전 수신 종료
  const endGroupCall = useCallback(() => {
    console.log("[GroupPriority] Group call ended");
    
    setIsGroupCallActive(false);
    setActiveGroupName(null);
    setWasIndividualCallActive(false);
  }, []);

  // 개별 무전으로 복귀
  const returnToIndividualCall = useCallback(() => {
    console.log("[GroupPriority] Returning to individual call");
    
    setIsGroupCallActive(false);
    setActiveGroupName(null);
    
    // 콜백 실행
    config.onReturnToIndividual?.();
  }, [config]);

  // 개별 무전 상태 기록
  const markIndividualCallActive = useCallback(() => {
    setWasIndividualCallActive(true);
  }, []);

  // 개별 무전 상태 해제
  const markIndividualCallInactive = useCallback(() => {
    setWasIndividualCallActive(false);
  }, []);

  // 정리
  useEffect(() => {
    return () => {
      if (groupCallTimeoutRef.current) {
        clearTimeout(groupCallTimeoutRef.current);
      }
    };
  }, []);

  return {
    isGroupCallActive,
    activeGroupName,
    wasIndividualCallActive,
    receiveGroupCall,
    endGroupCall,
    returnToIndividualCall,
    markIndividualCallActive,
    markIndividualCallInactive,
  };
}
