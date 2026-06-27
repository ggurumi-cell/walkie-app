# Supabase 연동 프롬프트 템플릿

> 이 문서에는 Supabase 설정 후 사용할 프롬프트들이 정리되어 있습니다.
> 각 단계별로 복사해서 Manus에 붙여넣기하면 됩니다.

---

## 📋 프롬프트 목록

### [Step 1] Supabase 환경 변수 설정

**언제 사용**: Supabase 프로젝트 생성 후, API 키를 확인했을 때

**프롬프트**:
```
Supabase 실시간 오디오 스트리밍을 위해 다음 환경 변수를 설정해줘:

1. VITE_SUPABASE_URL: [여기에 Project URL 붙여넣기]
   예: https://xxxxxxxxxxxxx.supabase.co

2. VITE_SUPABASE_ANON_KEY: [여기에 anon key 붙여넣기]
   예: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

설정 후에 환경 변수가 제대로 적용되었는지 확인해줘.
```

**예시 (실제 값 포함)**:
```
Supabase 실시간 오디오 스트리밍을 위해 다음 환경 변수를 설정해줘:

1. VITE_SUPABASE_URL: https://abcdefghijklmnop.supabase.co

2. VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzQ1Njc4MCwiZXhwIjoxOTM5MDMyNzgwfQ.abcdefghijklmnopqrstuvwxyz123456

설정 후에 환경 변수가 제대로 적용되었는지 확인해줘.
```

---

### [Step 2] 실제 Realtime 오디오 스트리밍 활성화

**언제 사용**: Step 1 완료 후, 환경 변수가 설정되었을 때

**프롬프트**:
```
Supabase 환경 변수가 설정되었어. 이제 실제 Realtime 오디오 스트리밍으로 전환해줘.

구체적으로 다음을 해줘:

1. client/src/pages/WalkieApp.tsx에서:
   - useSimpleWalkieAudio를 useWalkieAudio로 변경
   - 로컬 시뮬레이션 모드에서 실제 Supabase Realtime 모드로 전환

2. client/src/hooks/useWalkieAudio.ts에서:
   - Supabase 클라이언트가 제대로 초기화되는지 확인
   - Realtime 채널 구독이 정상 작동하는지 확인
   - 오디오 청크가 실제로 Supabase로 전송되는지 확인

3. 테스트:
   - 로컬에서 2개 브라우저로 다중 사용자 테스트
   - 1:1 무전 기능 확인
   - 그룹 무전 기능 확인

완료 후 테스트 결과를 알려줘.
```

---

### [Step 3] 오디오 품질 최적화 (선택사항)

**언제 사용**: Step 2 완료 후, 오디오 품질을 개선하고 싶을 때

**프롬프트**:
```
현재 앱의 오디오 품질을 최적화해줘.

구체적으로:

1. Opus 코덱 인코딩 추가:
   - libopus.js 또는 유사한 라이브러리 설치
   - 오디오 비트레이트를 16kbps로 설정 (전화기 음질 수준)
   - 샘플 레이트를 16kHz로 설정

2. 오디오 청크 크기 최적화:
   - 청크 크기를 1024 samples로 설정 (지연 최소화)
   - 전송 간격을 50ms로 설정

3. 성능 테스트:
   - 2개 브라우저로 다중 사용자 테스트
   - 오디오 품질 확인
   - 지연 시간 확인

완료 후 테스트 결과를 알려줘.
```

---

### [Step 4] 통화 기록 저장 기능 추가

**언제 사용**: Step 2 또는 3 완료 후, 통화 기록을 저장하고 싶을 때

**프롬프트**:
```
무전 통화 기록을 Supabase 데이터베이스에 저장하는 기능을 추가해줘.

구체적으로:

1. 데이터베이스 스키마 추가:
   - walkie_call_logs 테이블 생성
   - 필드: id, senderId, receiverId, groupId, startTime, endTime, duration, type (1:1 또는 group)

2. 백엔드 API 추가:
   - walkie.startCall: 무전 시작 기록
   - walkie.endCall: 무전 종료 기록
   - walkie.getCallHistory: 통화 기록 조회

3. 프론트엔드 통합:
   - 무전 시작 시 startCall 호출
   - 무전 종료 시 endCall 호출

4. 테스트:
   - 1:1 무전 후 기록 저장 확인
   - 그룹 무전 후 기록 저장 확인
   - 통화 기록 조회 확인

완료 후 테스트 결과를 알려줘.
```

---

### [Step 5] 관리자 대시보드 추가

**언제 사용**: Step 4 완료 후, 관리자 기능을 추가하고 싶을 때

**프롬프트**:
```
관리자 대시보드를 추가해줘. 관리자는 다음을 볼 수 있어야 해:

1. 사용자 관리:
   - 모든 사용자 목록 (이름, 사번, 상태)
   - 사용자 추가/수정/삭제
   - 사용자 역할 관리 (일반 사용자 / 관리자)

2. 그룹 관리:
   - 모든 그룹 목록
   - 그룹 추가/수정/삭제
   - 그룹 멤버 관리

3. 통화 기록 조회:
   - 모든 통화 기록 목록 (날짜, 참여자, 지속 시간)
   - 필터링 및 검색
   - 통화 기록 통계 (일일/주간/월간 통화 수)

4. 시스템 상태:
   - 현재 접속 중인 사용자 수
   - 실시간 무전 현황
   - 시스템 상태 모니터링

구현 방법:
- client/src/pages/AdminDashboard.tsx 생성
- 관리자 역할 확인 후 접근 제한
- 모든 데이터는 Supabase에서 조회

완료 후 테스트 결과를 알려줘.
```

---

### [Step 6] 앱 배포

**언제 사용**: 모든 기능 테스트 완료 후, 실제 배포할 때

**프롬프트**:
```
무전기 앱을 배포해줘.

배포 전 확인사항:
- [ ] Supabase 환경 변수 설정 완료
- [ ] 로컬 테스트 완료 (모든 기능 정상 작동)
- [ ] 모든 테스트 통과 (pnpm test)
- [ ] 체크포인트 생성 완료

배포 방법:
1. 최종 체크포인트 생성
2. Management UI에서 "Publish" 버튼 클릭
3. 배포 완료 대기 (약 2-5분)
4. 공개 URL 확인

배포 후 다음을 확인해줘:
- 공개 URL에서 앱 접속 가능
- 로그인 기능 정상 작동
- 1:1 무전 기능 정상 작동
- 그룹 무전 기능 정상 작동
- 다중 사용자 동시 접속 테스트

완료 후 배포된 앱 URL을 알려줘.
```

---

## 🔍 각 프롬프트 사용 예시

### 예시 1: 처음부터 끝까지 배포하기

```
[Step 1 프롬프트 실행]
↓
Supabase 환경 변수 설정 완료

[Step 2 프롬프트 실행]
↓
실제 Realtime 오디오 스트리밍 활성화

[로컬 테스트 (2개 브라우저)]
↓
모든 기능 정상 작동 확인

[Step 6 프롬프트 실행]
↓
앱 배포 완료
```

### 예시 2: 배포 후 기능 추가하기

```
[배포된 앱 사용 중]

[Step 4 프롬프트 실행]
↓
통화 기록 저장 기능 추가

[Step 5 프롬프트 실행]
↓
관리자 대시보드 추가

[Step 6 프롬프트 실행]
↓
업데이트된 앱 재배포
```

---

## ⚠️ 주의사항

### 1. API 키 보안
- `VITE_SUPABASE_ANON_KEY`는 공개 키이므로 앱에 포함되어도 괜찮습니다.
- `service_role` 키는 절대 공개하지 마세요.

### 2. 환경 변수 확인
- 프롬프트 실행 후 항상 환경 변수가 제대로 설정되었는지 확인하세요.
- Management UI → Settings → Secrets에서 확인 가능합니다.

### 3. 테스트 계정
- 테스트 시 다음 계정을 사용하세요:
  - EMP001 / 1234 (김철수)
  - EMP002 / 5678 (이영희)
  - EMP003 / 9012 (박민준)

### 4. 배포 전 체크리스트
- [ ] 로컬 테스트 완료
- [ ] 모든 테스트 통과 (`pnpm test`)
- [ ] 체크포인트 생성
- [ ] 환경 변수 확인

---

## 📞 지원

문제가 발생하면:

1. **SUPABASE_SETUP_GUIDE.md** 의 "문제 해결" 섹션 확인
2. Supabase 대시보드에서 로그 확인
3. 브라우저 개발자 도구 (F12) → Console에서 에러 메시지 확인
4. 필요하면 새로운 프롬프트로 문제 해결 요청

---

**모든 단계를 완료하면 완전히 작동하는 실시간 무전기 앱을 얻을 수 있습니다!** 🎉
