// 무전기 앱 서비스워커
// 실시간 통신 앱 특성상 적극적인 캐싱은 하지 않고,
// PWA 설치(홈 화면 추가)를 위한 최소 요건만 충족합니다.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // 캐싱 없이 그대로 네트워크로 통과 (실시간 데이터가 오래된 캐시로 대체되는 것 방지)
  event.respondWith(fetch(event.request));
});
