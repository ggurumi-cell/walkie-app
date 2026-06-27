# 실시간 전체 공지사항 기능 가이드

## 📋 개요

무전기 앱에 실시간 전체 공지사항 기능이 추가되었습니다. 관리자가 모든 사용자에게 긴급 또는 일반 공지를 실시간으로 전송할 수 있으며, 사용자는 공지를 받고 타임라인에서 확인할 수 있습니다. 자정(00:00)이 되면 자동으로 모든 공지사항이 삭제됩니다.

---

## 🎯 주요 기능

### 1. 실시간 공지 배너
- 공지 발송 시 화면 상단에 **초록색(일반) 또는 빨간색(긴급)** 배너가 나타남
- 배너에는 제목, 내용, 발신자, 발송 시간이 표시됨
- 사용자가 닫기 버튼을 클릭하거나 10초 후 자동으로 사라짐

### 2. 공지사항 타임라인
- 화면 우측 하단에 **"오늘의 공지"** 탭이 고정됨
- 토글하면 오늘 발송된 모든 공지사항을 시간순으로 확인 가능
- 각 공지사항 옆에 삭제 버튼이 있음

### 3. 자정 자동 삭제
- 사용자의 기기 시간 기준으로 매일 자정(00:00)에 자동 실행
- 로컬 저장소(localStorage)에 저장된 공지사항이 모두 삭제됨
- 다음 날 아침에는 깨끗한 화면으로 시작

### 4. 공지 입력 폼
- 관리자가 제목, 내용, 우선순위를 입력하여 공지 전송
- 제목: 최대 200자
- 내용: 제한 없음
- 우선순위: 일반(노란색) 또는 긴급(빨간색)

---

## 🛠️ 기술 구현

### 데이터베이스 스키마
```sql
CREATE TABLE `walkie_announcements` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `senderId` int NOT NULL,
  `senderName` varchar(100) NOT NULL,
  `priority` enum('normal','urgent') DEFAULT 'normal',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` timestamp NULL
);
```

### tRPC API 프로시저

#### 공지 생성
```typescript
walkie.createAnnouncement({
  title: "긴급 공지",
  content: "모든 직원에게 긴급 공지입니다.",
  senderId: 1,
  senderName: "관리자",
  priority: "urgent"
})
```

#### 오늘의 공지 조회
```typescript
walkie.getAnnouncementsForToday()
```

#### 모든 공지 조회
```typescript
walkie.getAllAnnouncementsQuery()
```

### UI 컴포넌트

#### AnnouncementBanner.tsx
- 실시간 공지 배너 표시
- Props: `announcement`, `onClose`

#### AnnouncementTimeline.tsx
- 공지사항 타임라인 표시
- Props: `announcements`, `onDelete`

#### AnnouncementForm.tsx
- 공지 입력 폼
- Props: `onSubmit`, `isLoading`, `senderName`

### 자동 삭제 로직

#### useAutoDeleteAnnouncements.ts
```typescript
// 자정 도달 시 콜백 실행
useAutoDeleteAnnouncements({
  onMidnightReached: () => {
    clearAnnouncementsFromStorage();
  }
});

// 유틸리티 함수
clearAnnouncementsFromStorage(); // localStorage 삭제
saveAnnouncementToStorage(announcement); // localStorage 저장
getAnnouncementsFromStorage(); // localStorage 조회
```

---

## 📱 사용 방법

### 관리자 (공지 발송)
1. WalkieApp 메인 화면에서 공지 입력 폼 찾기
2. 제목과 내용 입력
3. 우선순위 선택 (일반/긴급)
4. "전체 공지 전송" 버튼 클릭
5. 모든 사용자 화면에 실시간으로 배너 표시

### 일반 사용자 (공지 확인)
1. 공지 배너가 화면 상단에 나타남
2. 내용 확인 후 닫기 버튼 클릭 (또는 10초 후 자동 닫힘)
3. 우측 하단 "오늘의 공지" 탭에서 지난 공지 확인 가능
4. 자정이 지나면 자동으로 모든 공지 삭제

---

## 🔄 Supabase Realtime 연동 (선택사항)

현재는 로컬 시뮬레이션으로 동작합니다. Supabase를 연동하면 실제 다중 사용자 환경에서 실시간 공지가 작동합니다.

**Supabase 연동 프롬프트:**
```
Supabase Realtime을 사용하여 공지사항 기능을 실제 다중 사용자 환경으로 전환해줘.
1. useWalkieAudio 훅처럼 useAnnouncementRealtime 훅 생성
2. Supabase 공지 채널 구독
3. 공지 수신 시 실시간 배너 표시
4. WalkieApp에 통합
```

---

## 📊 테스트

### 백엔드 테스트 (vitest)
```bash
pnpm test server/walkie.announcements.test.ts
```

**테스트 항목:**
- 공지 생성
- 오늘의 공지 조회
- 모든 공지 조회
- 긴급 공지 생성
- 일반 공지 생성

### 수동 테스트 (개발자 콘솔)
```javascript
// 테스트용 공지 생성 (콘솔)
__simulateAnnouncement({
  title: "테스트 공지",
  content: "이것은 테스트 공지입니다.",
  senderName: "테스트 관리자",
  priority: "normal"
});

// 긴급 공지 테스트
__simulateAnnouncement({
  title: "긴급 공지",
  content: "긴급 상황입니다!",
  senderName: "시스템",
  priority: "urgent"
});
```

---

## 🎨 UI 색상 및 스타일

| 우선순위 | 배너 색상 | 타임라인 색상 | 아이콘 |
|---------|---------|-----------|--------|
| 일반 | 노란색 (bg-yellow-500) | 노란색 배경 (bg-yellow-50) | 없음 |
| 긴급 | 빨간색 (bg-red-500) | 빨간색 배경 (bg-red-50) | 경고 아이콘 |

---

## ⚙️ 설정 및 커스터마이징

### 배너 자동 닫기 시간 변경
`client/src/components/AnnouncementBanner.tsx` 라인 20:
```typescript
const timer = setTimeout(() => {
  setIsVisible(false);
  setTimeout(() => onClose(), 300);
}, 10000); // 10초 → 원하는 시간(ms)으로 변경
```

### 타임라인 최대 높이 변경
`client/src/components/AnnouncementTimeline.tsx` 라인 42:
```typescript
<div className="overflow-y-auto max-h-80 divide-y">
  {/* max-h-80 → 원하는 높이로 변경 */}
</div>
```

### 자정 자동 삭제 비활성화
`client/src/pages/WalkieApp.tsx`에서 `useAutoDeleteAnnouncements` 훅 호출 제거

---

## 🐛 문제 해결

### 공지가 나타나지 않음
1. 브라우저 콘솔에서 에러 확인
2. localStorage 확인: `localStorage.getItem('walkie_announcements_timeline')`
3. 서버 연결 상태 확인

### 자정에 공지가 삭제되지 않음
1. 기기 시간 확인
2. 브라우저 개발자 도구에서 타이머 확인
3. localStorage 수동 삭제: `localStorage.removeItem('walkie_announcements_timeline')`

### 타임라인이 보이지 않음
1. 화면 우측 하단 확인
2. CSS 클래스 충돌 확인
3. z-index 값 조정 (현재: z-40)

---

## 📝 다음 단계

1. **Supabase 실제 연동**: 다중 사용자 실시간 공지
2. **음성 알림 추가**: 공지 수신 시 알림음
3. **공지 만료 설정**: expiresAt 필드 활용
4. **공지 통계**: 공지 조회수, 읽음 여부 추적
5. **공지 검색**: 타임라인에서 공지 검색 기능

---

## 📞 지원

문제가 발생하면 개발자 콘솔에서 다음 명령어로 상태를 확인하세요:
```javascript
console.log("Announcements:", localStorage.getItem('walkie_announcements_timeline'));
console.log("Current time:", new Date().toLocaleString());
```
