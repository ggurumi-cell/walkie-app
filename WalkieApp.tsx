import { useState, useEffect, useRef } from "react";
import { Radio, Users, Volume2 } from "lucide-react";
import { useWalkieAudio } from "./useWalkieAudio";
import { createClient } from "@supabase/supabase-js";

interface WalkieUser {
  id: number;
  name: string;
  employeeId: string;
  team?: string;
}

interface WalkieAppProps {
  currentUser: WalkieUser;
  onLogout: () => void;
}

type TransmitState = "idle" | "transmitting" | "receiving";

function getChannelName(userId1: number, userId2: number): string {
  const [a, b] = [userId1, userId2].sort((x, y) => x - y);
  return `walkie-channel-${a}-${b}`;
}

interface CallLog {
  id: string;
  senderName: string;
  receiverName: string;
  isBroadcast: boolean;
  startedAt: Date;
}

export default function WalkieApp({ currentUser, onLogout }: WalkieAppProps) {
  const [selectedUser, setSelectedUser] = useState<WalkieUser | null>(null);
  const [prevSelectedUser, setPrevSelectedUser] = useState<WalkieUser | null>(null);
  const [transmitState, setTransmitState] = useState<TransmitState>("idle");
  const [allUsers, setAllUsers] = useState<WalkieUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastAlert, setBroadcastAlert] = useState<string | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("전체");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const allUsersRef = useRef<WalkieUser[]>([]);
  const isBroadcastingRef = useRef(false);

  const favoritesStorageKey = `walkie_favorites_${currentUser.id}`;

  // 즐겨찾기 불러오기 (직원별로 로컬 저장)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(favoritesStorageKey);
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch (e) {
      // 무시
    }
  }, [favoritesStorageKey]);

  const toggleFavorite = (userId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      try {
        localStorage.setItem(favoritesStorageKey, JSON.stringify([...next]));
      } catch (e) {
        // 무시
      }
      return next;
    });
  };

  // 조 목록 (데이터에 실제 존재하는 조만 순서대로 표시)
  const teamOptions = ["전체", "1 조", "2 조", "3 조", "4 조"].filter(
    t => t === "전체" || allUsers.some(u => u.team === t)
  );

  // 검색 + 조 필터 + 즐겨찾기 상단고정 적용된 동료 목록
  const displayedUsers = allUsers
    .filter(u => teamFilter === "전체" || u.team === teamFilter)
    .filter(u => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.employeeId.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aFav = favorites.has(a.id) ? 1 : 0;
      const bFav = favorites.has(b.id) ? 1 : 0;
      return bFav - aFav;
    });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => { allUsersRef.current = allUsers; }, [allUsers]);

  // 사용자 목록 로드
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) {
      setAllUsers([
        { id: 1, name: "홍길동", employeeId: "EMP001" },
        { id: 2, name: "김철수", employeeId: "EMP002" },
        { id: 3, name: "이영희", employeeId: "EMP003" },
      ].filter(u => u.id !== currentUser.id));
      setIsLoading(false);
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    supabase
      .from("walkie_users")
      .select("id, name, employee_id, team")
      .neq("id", currentUser.id)
      .then(({ data, error }) => {
        if (error) console.error("[Walkie] 유저 로드 실패:", error);
        if (data) {
          setAllUsers(data.map((u: any) => ({
            id: u.id,
            name: u.name,
            employeeId: u.employee_id,
            team: u.team,
          })));
        }
        setIsLoading(false);
      });
  }, [currentUser.id]);

  // 통화 로그 저장 함수
  const addCallLog = (senderName: string, receiverName: string, isBroadcast: boolean) => {
    const now = new Date();
    const newLog: CallLog = {
      id: Date.now().toString(),
      senderName,
      receiverName,
      isBroadcast,
      startedAt: now,
    };
    setCallLogs(prev => {
      // 24시간 지난 로그 제거 + 07시 기준 초기화
      const cutoff = new Date();
      cutoff.setHours(7, 0, 0, 0);
      if (now < cutoff) cutoff.setDate(cutoff.getDate() - 1);
      return [...prev.filter(l => l.startedAt >= cutoff), newLog];
    });
  };

  const channelName = selectedUser
    ? getChannelName(currentUser.id, selectedUser.id)
    : `walkie-idle-${currentUser.id}`;

  const audio = useWalkieAudio({
    channelName,
    userId: currentUser.id,
    userName: currentUser.name,
    onStateChange: (state) => {
      if (!isBroadcastingRef.current) {
        setTransmitState(state);
        if (state === "idle") setStatusMsg("");
      }
    },
    onReceiveAudio: ({ senderName }) => {
      if (!isBroadcastingRef.current) {
        setStatusMsg(`🔊 ${senderName}님의 음성 수신 중...`);
      }
    },
    onIncomingCall: (senderName, senderId) => {
      // 수신자 화면에서 발신자 자동 선택
      const caller = allUsersRef.current.find(u => u.id === senderId);
      if (caller) setSelectedUser(caller);
      setIncomingAlert(`📻 ${senderName}님이 호출 중...`);
      setTimeout(() => setIncomingAlert(null), 3000);
    },
    onBroadcastStart: (senderName) => {
      // 전체통화 수신: 개별통화 상태 저장 후 전체통화로 전환
      isBroadcastingRef.current = true;
      setIsBroadcasting(true);
      setTransmitState("receiving");
      setBroadcastAlert(`📢 ${senderName}님의 전체통화`);
      setStatusMsg(`📢 ${senderName}님 전체통화 중...`);
      addCallLog(senderName, "전체", true);
    },
    onBroadcastEnd: () => {
      // 전체통화 종료: 개별통화 원상태 복귀
      isBroadcastingRef.current = false;
      setIsBroadcasting(false);
      setBroadcastAlert(null);
      setTransmitState("idle");
      setStatusMsg("");
    },
  });

  const handleUserSelect = (user: WalkieUser) => {
    if (transmitState === "transmitting") audio.stopTransmitting();
    setSelectedUser(user);
    setStatusMsg("");
  };

  const handlePTT = async () => {
    if (!selectedUser) { alert("무전할 상대를 먼저 선택해주세요."); return; }
    if (transmitState === "receiving") return;

    if (transmitState === "idle") {
      // 수신자에게 자동 채널 전환 신호 전송
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        supabase.channel("walkie-notify-global").send({
          type: "broadcast",
          event: "call_request",
          payload: {
            senderName: currentUser.name,
            senderId: currentUser.id,
            targetId: selectedUser.id,
          },
        });
      }
      await audio.startTransmitting(false);
      setStatusMsg(`🎤 ${selectedUser.name}님에게 송신 중...`);
      addCallLog(currentUser.name, selectedUser.name, false);
    } else if (transmitState === "transmitting") {
      audio.stopTransmitting(false);
      setStatusMsg("");
    }
  };

  const handleBroadcastPTT = async () => {
    if (isBroadcasting && transmitState === "transmitting") {
      audio.stopTransmitting(true);
      isBroadcastingRef.current = false;
      setIsBroadcasting(false);
      setTransmitState("idle");
      setStatusMsg("");
    } else {
      if (transmitState === "transmitting") audio.stopTransmitting(false);
      isBroadcastingRef.current = true;
      setIsBroadcasting(true);
      await audio.startTransmitting(true);
      setTransmitState("transmitting");
      setStatusMsg("📢 전체통화 송신 중...");
      addCallLog(currentUser.name, "전체", true);
    }
  };

  const bgColor =
    transmitState === "transmitting" ? "#22c55e" :
    transmitState === "receiving" ? "#3b82f6" : "#6b7280";

  const btnText =
    transmitState === "transmitting" ? "🎤 송신 중... (다시 누르면 종료)" :
    transmitState === "receiving" ? "🔊 수신 중..." :
    "누르고 말하기 (PTT)";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
      {/* 상단 바 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 14, color: "#475569" }}>무전 대기 중</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 600, color: "#1e293b" }}>{currentUser.name}</span>
          <button onClick={onLogout} style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 120px" }}>

        {/* 상단 고정 PTT 영역 - 스크롤해도 항상 화면에 보임 */}
        <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#f8fafc", paddingTop: 4, paddingBottom: 12 }}>
          {/* 📢 전체통화 수신 알림 배너 */}
          {broadcastAlert && (
            <div style={{
              background: "#fef08a", border: "2px solid #eab308",
              borderRadius: 12, padding: "16px", marginBottom: 16,
              fontWeight: 700, color: "#713f12", fontSize: 16,
              textAlign: "center", animation: "pulse 0.8s infinite",
            }}>
              {broadcastAlert}
            </div>
          )}

          {/* 📻 개별 호출 알림 */}
          {incomingAlert && !broadcastAlert && (
            <div style={{
              background: "#dbeafe", border: "1px solid #93c5fd",
              borderRadius: 10, padding: "12px 16px", marginBottom: 16,
              fontWeight: 600, color: "#1e40af", fontSize: 15, textAlign: "center",
            }}>
              {incomingAlert}
            </div>
          )}

          {/* PTT 버튼 영역 */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {selectedUser ? (
              <>
                <p style={{ color: "#64748b", margin: 0 }}>
                  상대방: <strong style={{ color: "#1e293b" }}>{selectedUser.name}</strong>
                </p>
                {statusMsg && (
                  <div style={{
                    width: "100%", padding: "12px 16px", borderRadius: 10,
                    background: isBroadcasting ? "#fef9c3" : transmitState === "transmitting" ? "#f0fdf4" : "#eff6ff",
                    border: `1px solid ${isBroadcasting ? "#fde047" : transmitState === "transmitting" ? "#86efac" : "#bfdbfe"}`,
                    color: isBroadcasting ? "#713f12" : transmitState === "transmitting" ? "#15803d" : "#1d4ed8",
                    fontWeight: 600, textAlign: "center", fontSize: 15,
                  }}>
                    {statusMsg}
                  </div>
                )}
                <button onClick={handlePTT} disabled={transmitState === "receiving" || isBroadcasting} style={{
                  width: "100%", height: 120, borderRadius: 16,
                  background: (transmitState === "receiving" || isBroadcasting) ? "#93c5fd" : bgColor,
                  border: "none", color: "#fff", fontSize: 18, fontWeight: 700,
                  cursor: (transmitState === "receiving" || isBroadcasting) ? "not-allowed" : "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                  boxShadow: transmitState === "transmitting" && !isBroadcasting ? "0 0 0 6px rgba(34,197,94,0.3)" : "none",
                }}>
                  <Radio size={32} />
                  <span>{isBroadcasting && transmitState !== "transmitting" ? "🔒 전체통화 중" : btnText}</span>
                </button>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, textAlign: "center" }}>
                  버튼을 눌러 말하고, 다시 누르면 송신이 종료됩니다
                </p>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>
                <Radio size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ margin: 0 }}>아래에서 무전할 상대를 선택하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* 동료 목록 */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} /> 동료 목록
          </h2>

          {/* 검색창 */}
          <input
            type="text"
            placeholder="이름 또는 직원번호 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: "1px solid #e2e8f0", fontSize: 14, marginBottom: 10,
              boxSizing: "border-box",
            }}
          />

          {/* 조 탭 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
            {teamOptions.map(team => (
              <button
                key={team}
                onClick={() => setTeamFilter(team)}
                style={{
                  padding: "6px 14px", borderRadius: 999, whiteSpace: "nowrap",
                  border: teamFilter === team ? "1px solid #22c55e" : "1px solid #e2e8f0",
                  background: teamFilter === team ? "#22c55e" : "#fff",
                  color: teamFilter === team ? "#fff" : "#475569",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                {team}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>불러오는 중...</p>
          ) : displayedUsers.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
              {allUsers.length === 0 ? "다른 사용자가 없습니다" : "검색 결과가 없습니다"}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {displayedUsers.map(user => (
                <div key={user.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <button onClick={() => handleUserSelect(user)} style={{
                    flex: 1, padding: "12px 16px", borderRadius: 10,
                    border: selectedUser?.id === user.id ? "2px solid #22c55e" : "1px solid #e2e8f0",
                    background: selectedUser?.id === user.id ? "#f0fdf4" : "#f8fafc",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      {user.employeeId}{user.team ? ` · ${user.team}` : ""}
                    </div>
                  </button>
                  <button
                    onClick={() => toggleFavorite(user.id)}
                    aria-label="즐겨찾기"
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: favorites.has(user.id) ? "#fefce8" : "#fff",
                      color: favorites.has(user.id) ? "#eab308" : "#cbd5e1",
                      fontSize: 18, cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 통화 로그 */}
        {callLogs.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 10 }}>📋 오늘의 통화 기록</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {callLogs.slice(-10).reverse().map(log => (
                <div key={log.id} style={{ fontSize: 12, color: "#64748b", padding: "6px 10px", background: log.isBroadcast ? "#fef9c3" : "#f8fafc", borderRadius: 8 }}>
                  {log.isBroadcast ? "📢" : "📻"} {log.senderName} → {log.receiverName}
                  <span style={{ float: "right", color: "#94a3b8" }}>
                    {log.startedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedUser && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#f1f5f9", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
            📡 채널: {channelName}
          </div>
        )}
      </div>

      {/* 하단 고정 전체통화 버튼 */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "2px solid #e2e8f0",
        padding: "12px 24px", display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>전체통화</div>
          <div style={{ fontSize: 11, color: "#cbd5e1" }}>모든 동료에게 동시 송신</div>
        </div>
        <button
          onClick={handleBroadcastPTT}
          disabled={transmitState === "receiving" && !isBroadcasting}
          style={{
            width: 80, height: 80, borderRadius: "50%",
            background: isBroadcasting && transmitState === "transmitting" ? "#ef4444" :
                        transmitState === "receiving" && !isBroadcasting ? "#94a3b8" : "#f59e0b",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: transmitState === "receiving" && !isBroadcasting ? "not-allowed" : "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
            boxShadow: isBroadcasting && transmitState === "transmitting" ? "0 0 0 6px rgba(239,68,68,0.3)" : "0 4px 12px rgba(245,158,11,0.4)",
            transition: "all 0.2s",
          }}
        >
          <Volume2 size={24} />
          <span>{isBroadcasting && transmitState === "transmitting" ? "종료" : "전체"}</span>
        </button>
      </div>
    </div>
  );
}
