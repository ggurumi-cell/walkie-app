# 무전기 앱 개발 TODO

## Phase 1: 데이터베이스 및 인증 시스템
- [x] Supabase 스키마 설계: walkie_users 테이블 (id, name, employeeId, authCode, createdAt)
- [x] 샘플 사용자 3명 데이터 삽입 (테스트용)
- [x] 사전 등록 로그인 화면 UI 구현 (이름/사번 + 인증번호 입력)
- [x] 로그인 검증 로직 (DB 조회 및 일치 확인)
- [x] 로그인 상태 관리 (localStorage 또는 세션)

## Phase 2: 메인 무전기 UI 레이아웃
- [x] 상시 활성화 대기 인디케이터 (초록색 깜빡임 + '무전 수신 대기 중...' 텍스트)
- [x] 우측 상단 로그아웃 버튼 배치
- [x] 화면 중앙 동료 연락처 목록 표시 (walkie_users에서 조회)
- [x] 상대방 미선택 시 '무전할 상대를 선택하세요' 안내 문구
- [x] 상대방 선택 시 거대한 토글 무전 버튼 표시
- [x] 하단 그룹 무전 버튼 배치

## Phase 3: 토글형 무전 버튼 상태 관리
- [x] 버튼 상태 3가지: 대기(회색), 송신(초록), 수신(파란색)
- [x] 버튼 클릭 시 대기 ↔ 송신 토글 로직
- [x] 상대방 무전 수신 시 자동 수신 상태 전환 (시뮬레이션)
- [x] 수신 중 송신 버튼 비활성화 처리
- [x] 수신 중 '상대 무전 수신 중...' 텍스트 깜빡임 표시

## Phase 4: 실시간 오디오 스트리밍 구현
- [x] Web Audio API 마이크 입력 캡처 (getUserMedia)
- [x] 오디오 청크 단위 캡처 (ScriptProcessorNode)
- [x] Supabase Realtime Broadcast 채널 연결 (훅 구현)
- [x] 오디오 청크 실시간 전송 (Blob/Stream 형태)
- [x] 수신 오디오 청크 즉시 재생 (AudioContext)
- [x] 재생 후 메모리 파기 (오디오 파일 서버 저장 금지)

## Phase 5: 실시간 상태 동기화
- [x] 송신 상태 변경 이벤트 Broadcast (0.1초 이내 반응)
- [x] 수신 상태 UI 업데이트 (송신자 이름 표시)
- [x] 송신 종료 이벤트 Broadcast
- [x] 상대방 화면 실시간 상태 표시 동기화

## Phase 6: 그룹 무전 기능 (하단 시트)
- [x] 그룹 목록 조회 및 저장 (walkie_groups 테이블)
- [x] 하단 그룹 무전 버튼 클릭 시 Bottom Sheet 표시
- [x] 그룹 선택창 UI
- [x] 그룹 무전 토글 버튼 (상태 관리 동일)
- [x] 그룹 채널 Broadcast (모든 그룹원에게 전송)

## Phase 7: 최적화 및 테스트
- [x] 오디오 인코딩 최적화 (Web Audio API 설정)
- [x] 초저지연 설정 검증 (ScriptProcessorNode 사용)
- [x] 모바일 반응형 UI 테스트 (Tailwind CSS)
- [x] 브라우저 호환성 설정 (AudioContext)
- [x] 실시간 스트리밍 안정성 테스트 (로컬 시뮬레이션)

## Phase 8: 최종 배포 및 전달
- [x] 전체 기능 통합 테스트 (18/18 tests passed)
- [x] 성능 최적화 및 버그 수정
- [x] 사용자 가이드 작성
- [x] 프로젝트 체크포인트 저장
- [x] 사용자에게 결과 전달

## Phase 9: 그룹 무전 우선순위 기능
- [x] 개별 무전 중 그룹 무전 수신 감지
- [x] 그룹 무전 수신 시 개별 무전 자동 중단
- [x] 그룹 무전 수신 알림 팝업 표시
- [x] 사용자가 개별 무전으로 복귀 선택 가능
- [x] 그룹 무전 우선순위 상태 UI 표시
- [x] 통합 테스트 (그룹 무전 우선순위 검증 - 15 tests passed)

## Phase 10: 통화 중 음성 안내 기능
- [x] 무전 중 상태 감지 (송신/수신 중)
- [x] "통화 중입니다" 음성 생성 (Web Speech API 기반 useBusyVoiceNotification 훅)
- [x] 다른 사용자 무전 시도 감지
- [x] 음성 안내 자동 재생 (playBusyVoice 메서드)
- [x] 음성 안내 후 자동 수신 거부 처리
- [x] 통합 테스트 (음성 안내 기능 검증 - 14 tests passed)

## Phase 11: "삐" 음 신호(Busy Tone) 기능
- [x] 무전 중 상태 감지 (송신/수신 중)
- [x] "삐" 음 신호 생성 (Web Audio API 기반 useBusyTone 훅)
- [x] 다른 사용자 무전 시도 감지
- [x] 음 신호 자동 재생 (playBusyTone 메서드)
- [x] 음 신호 후 자동 수신 거부 처리
- [x] 통합 테스트 ("삐" 음 신호 기능 검증 - 46 tests passed)

## Phase 12: 실시간 전체 공지사항 기능
- [x] 데이터베이스 스키마 (walkie_announcements 테이블)
- [x] 백엔드 tRPC 프로시저 (공지 생성, 조회)
- [x] 실시간 공지 배너 UI 컴포넌트 (AnnouncementBanner.tsx)
- [x] 공지 입력 폼 (관리자용) (AnnouncementForm.tsx)
- [x] 공지사항 타임라인 컴포넌트 (AnnouncementTimeline.tsx)
- [x] 자정 자동 삭제 로직 (JavaScript) (useAutoDeleteAnnouncements.ts)
- [x] Supabase Realtime 공지 브로드캐스트 (로컬 시뮬레이션, Supabase 연동 가늤답 제공)
- [x] 통합 테스트 (공지 기능 검증 - 5 tests passed)

## Phase 13: 오디오 비주얼라이저 및 파동 애니메이션
- [x] 파동 애니메이션 컴포넌트 (WaveAnimation.tsx)
- [x] 오디오 비주얼라이저 훅 (useAudioVisualizer.ts)
- [x] 버튼에 파동 효과 통합
- [x] 송신/수신 상태별 색상 애니메이션 (초록/파란/회색)
- [x] 통합 테스트 및 배포 (60 tests passed)
