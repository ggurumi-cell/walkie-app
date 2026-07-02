import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// PWA 서비스워커 등록 (홈 화면 설치 지원)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[Walkie] 서비스워커 등록 실패:', err)
    })
  })
}
