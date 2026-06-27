# Supabase 설정 및 실시간 무전기 앱 연동 완전 가이드

> 이 가이드는 초보자도 따라할 수 있도록 작성되었습니다. 각 단계를 순서대로 진행하세요.

---

## 📌 목차
1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [API 키 확인](#2-api-키-확인)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [실시간 오디오 스트리밍 활성화](#4-실시간-오디오-스트리밍-활성화)
5. [앱 배포](#5-앱-배포)
6. [문제 해결](#6-문제-해결)

---

## 1. Supabase 프로젝트 생성

### 1-1. Supabase 가입 및 로그인

1. **웹사이트 방문**: [https://supabase.com](https://supabase.com) 접속
2. **"Start your project"** 또는 **"Sign Up"** 클릭
3. 다음 중 하나로 가입:
   - GitHub 계정 (권장)
   - Google 계정
   - 이메일 주소

### 1-2. 새 프로젝트 생성

1. Supabase 대시보드에 로그인 후, **"New Project"** 클릭
2. 다음 정보 입력:
   - **Project Name**: `walkie-talkie-app` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 입력 (예: `Abc123!@#Secure`)
   - **Region**: `Asia Pacific (Singapore)` 선택 (한국과 가장 가까움)
3. **"Create new project"** 클릭
4. 프로젝트 생성 완료 대기 (약 1-2분)

### 1-3. 프로젝트 대시보드 확인

프로젝트 생성 완료 후, 다음 화면이 나타납니다:
- 좌측 메뉴에 "SQL Editor", "Authentication", "Realtime" 등 옵션
- 상단에 프로젝트 이름 표시

---

## 2. API 키 확인

### 2-1. API 키 위치 찾기

1. Supabase 대시보드 좌측 메뉴에서 **"Settings"** 클릭
2. **"API"** 탭 클릭
3. 다음 정보가 표시됩니다:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
API Keys:
  - anon (public): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - service_role (secret): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2-2. 필요한 정보 복사

다음 두 가지 정보를 메모장에 복사해두세요:

| 정보 | 값 | 용도 |
|------|-----|------|
| **Project URL** | `https://xxxxxxxxxxxxx.supabase.co` | Supabase 서버 주소 |
| **anon (public) Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | 클라이언트 앱에서 사용 |

> ⚠️ **중요**: `service_role` 키는 절대 공개하지 마세요. 이 키는 서버에서만 사용됩니다.

---

## 3. 환경 변수 설정

### 3-1. 현재 상태 확인

현재 앱은 다음과 같이 설정되어 있습니다:
- 로컬 시뮬레이션 모드 활성화 (`useSimpleWalkieAudio` 훅 사용)
- Supabase 환경 변수 미설정

### 3-2. Supabase 환경 변수 추가

다음 프롬프트를 사용하여 Manus에 환경 변수를 설정하라고 요청하세요:

```
Supabase 실시간 오디오 스트리밍을 위해 다음 환경 변수를 설정해줘:

1. VITE_SUPABASE_URL: https://xxxxxxxxxxxxx.supabase.co (위에서 복사한 Project URL)
2. VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (위에서 복사한 anon key)

이 설정 후에 useWalkieAudio 훅을 활성화하고 실제 Realtime 오디오 스트리밍이 작동하도록 앱을 업데이트해줘.
```

### 3-3 환경 변수 설정 후 확인

설정이 완료되면, 앱의 다음 파일에서 환경 변수가 사용됩니다:
- `client/src/hooks/useWalkieAudio.ts`: Supabase Realtime 채널 연결
- `client/src/pages/WalkieApp.tsx`: 실시간 오디오 스트리밍 활성화

---

## 4. 실시간 오디오 스트리밍 활성화

### 4-1. 현재 상태 (시뮬레이션 모드)

```typescript
// 현재 사용 중인 훅 (로컬 시뮬레이션)
import { useSimpleWalkieAudio } from "@/hooks/useSimpleWalkieAudio";

// 특징:
// - 마이크 입력 캡처만 가능
// - 실제 오디오 전송 불가
// - 다른 사용자와 통신 불가
```

### 4-2. 실제 Supabase 모드로 전환

다음 프롬프트를 사용하세요:

```
현재 앱은 로컬 시뮬레이션 모드(useSimpleWalkieAudio)를 사용하고 있어. 
Supabase 환경 변수가 설정되었으니, 이제 실제 Realtime 오디오 스트리밍으로 전환해줘.

구체적으로:
1. WalkieApp.tsx에서 useSimpleWalkieAudio를 useWalkieAudio로 변경
2. useWalkieAudio 훅에서 Supabase Realtime Broadcast 채널 활성화
3. 오디오 청크를 실제로 Supabase 채널로 전송
4. 수신한 오디오 청크를 즉시 재생
5. 송신/수신 상태 이벤트를 Realtime으로 동기화

이렇게 하면 여러 사용자가 동시에 무전할 수 있게 돼.
```

### 4-3. 다중 사용자 테스트

실제 Supabase 연동 후, 다음과 같이 테스트할 수 있습니다:

1. **브라우저 2개 열기**:
   - 브라우저 1: 사용자 EMP001 (김철수) 로그인
   - 브라우저 2: 사용자 EMP002 (이영희) 로그인

2. **1:1 무전 테스트**:
   - 브라우저 1에서 "이영희" 선택 → 무전 버튼 클릭 (송신)
   - 브라우저 2에서 수신 상태 표시 확인
   - 브라우저 2에서 "김철수" 선택 → 무전 버튼 클릭 (송신)
   - 브라우저 1에서 수신 상태 표시 확인

3. **그룹 무전 테스트**:
   - 두 브라우저 모두 "그룹 무전 전환" 클릭
   - 같은 그룹 선택 (예: "전체 팀")
   - 한 쪽에서 송신하면 다른 쪽에서 수신 확인

---

## 5. 앱 배포

### 5-1. 배포 전 체크리스트

배포하기 전에 다음을 확인하세요:

- [ ] Supabase 환경 변수 설정 완료
- [ ] 로컬 테스트 완료 (2개 브라우저로 다중 사용자 테스트)
- [ ] 모든 테스트 통과 (`pnpm test` 실행 결과 18/18 통과)
- [ ] 로그인 기능 정상 작동
- [ ] 1:1 무전 기능 정상 작동
- [ ] 그룹 무전 기능 정상 작동

### 5-2. Manus 플랫폼에서 배포

1. **Management UI 열기**:
   - 앱 미리보기 화면의 우측 상단 "Management UI" 버튼 클릭

2. **체크포인트 생성**:
   - 좌측 메뉴 "Dashboard" → "Checkpoint" 섹션
   - "Create Checkpoint" 버튼 클릭
   - 설명 입력: "Supabase Realtime 오디오 스트리밍 활성화"
   - 저장

3. **배포 (Publish)**:
   - 체크포인트 생성 후, 우측 상단 "Publish" 버튼 활성화
   - "Publish" 클릭
   - 배포 완료 대기 (약 2-5분)

4. **배포된 앱 확인**:
   - 배포 완료 후, 공개 URL 제공
   - 예: `https://walkie-talkie-app-xxxxx.manus.space`
   - 이 URL을 통해 누구나 앱 접속 가능

### 5-3. 커스텀 도메인 설정 (선택사항)

1. Management UI → "Settings" → "Domains"
2. "Add Custom Domain" 클릭
3. 원하는 도메인 입력 (예: `walkie.yourcompany.com`)
4. DNS 설정 완료

---

## 6. 문제 해결

### Q1: "Supabase 환경 변수를 설정했는데 앱이 여전히 시뮬레이션 모드인 것 같아요"

**A**: 다음을 확인하세요:

1. **환경 변수 확인**:
   ```bash
   # Management UI → Settings → Secrets에서 확인
   VITE_SUPABASE_URL: https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **앱 코드 확인**:
   - `client/src/pages/WalkieApp.tsx`에서 `useWalkieAudio` 사용 확인
   - `useSimpleWalkieAudio` 사용 중이면 프롬프트로 변경 요청

3. **브라우저 캐시 삭제**:
   - 개발자 도구 (F12) → Application → Clear Site Data
   - 페이지 새로고침

### Q2: "두 사용자 간에 오디오가 전송되지 않아요"

**A**: 다음을 확인하세요:

1. **Supabase Realtime 활성화 확인**:
   - Supabase 대시보드 → "Realtime" 메뉴
   - 프로젝트의 Realtime이 "Enabled" 상태인지 확인

2. **네트워크 연결 확인**:
   - 두 브라우저가 같은 네트워크에 연결되어 있는지 확인
   - 방화벽이 WebSocket 연결을 차단하지 않는지 확인

3. **마이크 권한 확인**:
   - 브라우저 설정에서 마이크 접근 허용 확인
   - 다른 앱이 마이크를 독점하지 않는지 확인

4. **브라우저 콘솔 확인**:
   - 개발자 도구 (F12) → Console 탭
   - 에러 메시지 확인 및 스크린샷 촬영

### Q3: "배포 후 앱이 작동하지 않아요"

**A**: 다음 단계를 따르세요:

1. **배포된 앱 콘솔 확인**:
   - Management UI → "Dashboard" → "Logs"
   - 에러 메시지 확인

2. **환경 변수 재확인**:
   - Management UI → "Settings" → "Secrets"
   - Supabase URL과 API 키가 정확한지 확인

3. **Supabase 상태 확인**:
   - Supabase 대시보드 접속
   - 프로젝트가 "Active" 상태인지 확인
   - Realtime 기능이 활성화되어 있는지 확인

### Q4: "Supabase 프로젝트를 삭제했어요. 다시 만들 수 있나요?"

**A**: 네, 다시 만들 수 있습니다:

1. 새 Supabase 프로젝트 생성 (위의 1-2 단계 참고)
2. 새 API 키 확인
3. 환경 변수 업데이트
4. 앱 재배포

---

## 📚 참고 자료

### Supabase 공식 문서
- [Supabase 시작하기](https://supabase.com/docs)
- [Realtime 기능](https://supabase.com/docs/guides/realtime)
- [JavaScript 클라이언트](https://supabase.com/docs/reference/javascript)

### 무전기 앱 관련 파일
- `client/src/hooks/useWalkieAudio.ts`: Supabase Realtime 오디오 스트리밍
- `client/src/pages/WalkieApp.tsx`: 메인 UI 및 상태 관리
- `server/routers.ts`: 사용자 및 그룹 조회 API

---

## 🎯 배포 후 다음 단계

배포 완료 후, 다음 기능을 추가할 수 있습니다:

### 1. 통화 기록 저장
```
통화 기록(송수신 시간, 참여자, 그룹)을 Supabase 데이터베이스에 저장하는 기능을 추가해줘.
```

### 2. 오디오 품질 향상
```
Opus 코덱을 사용하여 오디오 비트레이트를 낮추고 전송 속도를 개선해줘.
```

### 3. 관리자 대시보드
```
관리자가 사용자, 그룹, 통화 기록을 관리할 수 있는 대시보드를 만들어줘.
```

---

## ✅ 체크리스트: 배포 완료 확인

배포가 완료되면 다음을 확인하세요:

- [ ] 공개 URL에서 앱 접속 가능
- [ ] 로그인 기능 정상 작동
- [ ] 1:1 무전 기능 정상 작동
- [ ] 그룹 무전 기능 정상 작동
- [ ] 다중 사용자 동시 접속 테스트 완료
- [ ] 모바일 환경에서도 정상 작동 확인

---

**질문이 있으시면 언제든지 물어보세요!** 🚀
