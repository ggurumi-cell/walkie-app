import { useState, useEffect } from "react";
import { LogOut, Radio, Users } from "lucide-react";
import { useWalkieAudio } from "./useWalkieAudio";

interface WalkieUser {
  id: number;
  name: string;
  employeeId: string;
}

interface WalkieAppProps {
  currentUser: WalkieUser;
  onLogout: () => void;
}

type TransmitState = "idle" | "transmitting" | "receiving";

// ✅ 채널명 대칭화 함수 - A↔B 항상 동일한 채널 사용
function getChannelName(userId1: number, userId2: number): string {
  const [a, b] = [userId1, userId2].sort((x, y) => x - y);
  return `walkie-channel-${a}-${b}`;
}

export default function WalkieApp({ currentUser, onLogout }: WalkieAppProps) {
  const [selectedUser, setSelectedUser] = useState<WalkieUser | null>(null);
  const [transmitState, setTransmitState] = useState<TransmitState>("idle");
  const [allUsers, setAllUsers] = useState<WalkieUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");

  // 사용자 목록 로드 (Supabase에서)
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Supabase 미설정 시 데모 유저
      setAllUsers([
        { id: 1, name: "홍길동", employeeId: "EMP001" },
        { id: 2, name: "김철수", employeeId: "EMP002" },
        { id: 3, name: "이영희", employeeId: "EMP003" },
      ].filter(u => u.id !== currentUser.id));
      setIsLoading(false);
      return;
    }

    import("@supabase/supabase-js").then(({ createClient }) => {
      const supabase = createClient(supabaseUrl, supabaseKey);
      supabase
        .from("walkie_users")
        .select("id, name, employee_id")
        .neq("id", currentUser.id)
        .then(({ data, error }) => {
          if (error) console.error("[Walkie] 유저 로드 실패:", error);
          if (data) {
            setAllUsers(data.map((u: any) => ({
              id: u.id,
              name: u.name,
              employeeId: u.employee_id,
            })));
          }
          setIsLoading(false);
        });
    });
  }, [currentUser.id]);

  const channelName = selectedUser
    ? getChannelName(currentUser.id, selectedUser.id)
    : "walkie-idle";

  const audio = useWalkieAudio({
    channelName,
    userId: currentUser.id,
    userName: currentUser.name,
    onStateChange: (state) => {
      setTransmitState(state);
      if (state === "receiving") setStatusMsg(`🔊 ${audio.receivingFrom || "상대방"}님 송신 중`);
      if (state === "idle") setStatusMsg("");
    },
    onReceiveAudio: ({ senderName }) => {
      setStatusMsg(`🔊 ${senderName}님의 음성 수신 중...`);
    },
  });

  const handlePTT = async () => {
    if (!selectedUser) {
      alert("무전할 상대를 먼저 선택해주세요.");
      return;
    }
    if (transmitState === "receiving") return;

    if (transmitState === "idle") {
      await audio.startTransmitting();
      setStatusMsg(`🎤 ${selectedUser.name}님에게 송신 중...`);
    } else if (transmitState === "transmitting") {
      audio.stopTransmitting();
      setStatusMsg("");
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

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
        {/* 동료 목록 */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} /> 동료 목록
          </h2>
          {isLoading ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>불러오는 중...</p>
          ) : allUsers.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>다른 사용자가 없습니다</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => { setSelectedUser(user); setStatusMsg(""); audio.stopTransmitting(); }}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: selectedUser?.id === user.id ? "2px solid #22c55e" : "1px solid #e2e8f0",
                    background: selectedUser?.id === user.id ? "#f0fdf4" : "#f8fafc",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{user.employeeId}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PTT 버튼 영역 */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {selectedUser ? (
            <>
              <p style={{ color: "#64748b", margin: 0 }}>
                상대방: <strong style={{ color: "#1e293b" }}>{selectedUser.name}</strong>
              </p>

              {/* 상태 메시지 */}
              {statusMsg && (
                <div style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: transmitState === "transmitting" ? "#f0fdf4" : "#eff6ff",
                  border: `1px solid ${transmitState === "transmitting" ? "#86efac" : "#bfdbfe"}`,
                  color: transmitState === "transmitting" ? "#15803d" : "#1d4ed8",
                  fontWeight: 600,
                  textAlign: "center",
                  fontSize: 15,
                }}>
                  {statusMsg}
                </div>
              )}

              {/* 거대 PTT 버튼 */}
              <button
                onClick={handlePTT}
                disabled={transmitState === "receiving"}
                style={{
                  width: "100%",
                  height: 120,
                  borderRadius: 16,
                  background: transmitState === "receiving" ? "#93c5fd" : bgColor,
                  border: "none",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: transmitState === "receiving" ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s",
                  boxShadow: transmitState === "transmitting" ? "0 0 0 6px rgba(34,197,94,0.3)" : "none",
                }}
              >
                <Radio size={32} />
                <span>{btnText}</span>
              </button>

              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, textAlign: "center" }}>
                버튼을 눌러 말하고, 다시 누르면 송신이 종료됩니다
              </p>
            </>
          ) : (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>
              <Radio size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ margin: 0 }}>위에서 무전할 상대를 선택하세요</p>
            </div>
          )}
        </div>

        {/* 채널 정보 (디버그용) */}
        {selectedUser && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#f1f5f9", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
            📡 채널: {channelName}
          </div>
        )}
      </div>
    </div>
  );
}
