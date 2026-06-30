import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import WalkieApp from "./WalkieApp"

interface WalkieUser {
  id: number
  name: string
  employeeId: string
  team?: string
}

const LOCAL_STORAGE_KEY = "walkie_logged_in_user"

export default function App() {
  const [user, setUser] = useState<WalkieUser | null>(null)
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  // 자동 로그인 유지 (새로고침해도 로그인 상태 유지)
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      }
    }
    setCheckingSession(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!employeeId.trim() || !password.trim()) {
      setErrorMsg("직원번호와 비밀번호를 입력해주세요.")
      return
    }

    if (!supabaseUrl || !supabaseKey) {
      setErrorMsg("서버 설정 오류입니다.")
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase
        .from("walkie_users")
        .select("id, name, employee_id, team, password")
        .eq("employee_id", employeeId.trim())
        .single()

      if (error || !data) {
        setErrorMsg("존재하지 않는 직원번호입니다.")
        setIsLoading(false)
        return
      }

      if (data.password !== password.trim()) {
        setErrorMsg("비밀번호가 일치하지 않습니다.")
        setIsLoading(false)
        return
      }

      const loggedInUser: WalkieUser = {
        id: data.id,
        name: data.name,
        employeeId: data.employee_id,
        team: data.team,
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loggedInUser))
      setUser(loggedInUser)
    } catch (err) {
      console.error("[Walkie] 로그인 오류:", err)
      setErrorMsg("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    setUser(null)
    setEmployeeId("")
    setPassword("")
  }

  if (checkingSession) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#94a3b8" }}>불러오는 중...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <h1 style={{ textAlign: "center", marginBottom: 32, fontSize: 22, color: "#1e293b" }}>📻 무전기 앱</h1>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                직원번호
              </label>
              <input
                type="text"
                placeholder="예: C301"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: 15,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: 15,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: "#dc2626", fontSize: 13, textAlign: "center", padding: "8px", background: "#fef2f2", borderRadius: 8 }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 8,
                padding: "14px 20px",
                borderRadius: 10,
                border: "none",
                background: isLoading ? "#94a3b8" : "#22c55e",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <WalkieApp currentUser={user} onLogout={handleLogout} />
}
