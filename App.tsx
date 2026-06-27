import { useState } from "react"
import WalkieApp from "./WalkieApp"

const USERS = [
  { id: 1, name: "홍길동", employeeId: "EMP001" },
  { id: 2, name: "김철수", employeeId: "EMP002" },
  { id: 3, name: "이영희", employeeId: "EMP003" },
]

export default function App() {
  const [user, setUser] = useState(null)
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <h1 style={{ textAlign: "center", marginBottom: 32, fontSize: 22, color: "#1e293b" }}>📻 무전기 앱</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {USERS.map(u => (
              <button key={u.id} onClick={() => setUser(u)} style={{ padding: "14px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", textAlign: "left", fontSize: 15, fontWeight: 600, color: "#1e293b" }}>
                {u.name} <span style={{ fontSize: 12, color: "#94a3b8" }}>({u.employeeId})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return <WalkieApp currentUser={user} onLogout={() => setUser(null)} />
}
