# Commit Strategy

## 1) 목표
이 문서의 목적은 다음을 만족하는 커밋 규칙을 정의하는 것이다.

- 변경 의도(Why)와 범위(What)가 커밋 메시지에서 즉시 파악된다.
- AI 코드리뷰/자동 요약/체인지로그 생성이 가능하도록 구조화된 정보를 제공한다.
- 되돌리기(revert), 체리픽(cherry-pick), 릴리즈 노트 작성이 쉬워진다.

---

## 2) 기본 원칙
### 2.1 커밋은 “작고 완결”되어야 한다
- 한 커밋은 **하나의 논리적 변경**을 담는다.
- “리팩터링 + 기능 추가 + 포맷” 같이 섞지 않는다.
- 테스트/빌드가 깨지지 않는 상태를 유지한다. (불가피하면 WIP 규칙을 따른다)

### 2.2 커밋 메시지만 읽어도 변경이 예측되어야 한다
- 제목(subject)은 명령형 + 핵심만
- 본문(body)은 왜(Why) / 어떻게(How) / 영향(Impact)을 구조적으로

### 2.3 생성/변경 파일이 많으면 요약을 반드시 남긴다
- “어디를 바꿨는지”를 AI가 추적할 수 있도록 범위를 적는다.

---

## 3) 브랜치 전략 (권장)
- `main`: 항상 배포 가능한 상태
- `develop`: 통합 개발 브랜치(선택)
- `feat/*`: 기능 개발
- `fix/*`: 버그 수정
- `chore/*`: 설정/도구/빌드
- `docs/*`: 문서
- `refactor/*`: 리팩터링

> 팀 규모가 작으면 `main + feat/*`만으로도 충분하다.

---

## 4) 커밋 타입 규칙

### 4.1 포맷
`<type>(<scope>): <subject>`

- **type**: 변경 종류
- **scope**: 변경 영역(모듈/도메인/패키지/레이어)
- **subject**: 한 줄 요약 (50자 내 권장)

### 4.2 type 목록
- `feat`: 사용자 가치가 있는 기능 추가/변경
- `fix`: 버그 수정
- `refactor`: 동작 변경 없는 구조 개선
- `perf`: 성능 개선
- `test`: 테스트 추가/수정
- `docs`: 문서만 변경
- `style`: 포맷/린트/세미콜론 등 (동작 변경 없음)
- `build`: 빌드 시스템/의존성 변경
- `ci`: CI 설정 변경
- `chore`: 기타 잡무(스크립트, 설정, 정리)
- `revert`: 되돌리기

### 4.3 scope 예시 (프로젝트에 맞게 고정)
- `auth`, `user`, `workspace`, `interview`, `resume`
- `api`, `db`, `infra`, `config`
- `ui`, `router`, `state`, `socket`

> scope는 자유롭게 늘리되, 팀 내에서 “같은 의미에 같은 scope”를 쓰도록 합의한다.

---

## 5) AI가 잘 이해하는 커밋 메시지 작성법
### 5.1 제목 규칙
- 동사로 시작(명령형): add / implement / support / fix / prevent / remove / rename
- 불필요한 수식어 제거: “some”, “minor”, “update” 남발 금지
- 결과가 드러나게 작성: “fix login” 보다 “fix login redirect when token expired”

✅ Good
- `feat(auth): add kakao login callback handler`
- `fix(api): prevent duplicate submission for interview start`
- `refactor(workspace): extract resume upload service`

❌ Bad
- `update`
- `fix bug`
- `changes`

### 5.2 본문(Body) 템플릿 (권장)
필요한 커밋에만 아래 템플릿을 사용한다(기능/버그/큰 리팩터링 등).

- **Context**: 왜 바꾸는가(문제/요구사항)
- **Changes**: 무엇을 바꿨는가(핵심 3~6개 bullet)
- **Impact**: 영향 범위(호환성/마이그레이션/릴리즈 노트)
- **Tests**: 어떤 검증을 했는가

예시:feat(interview): support single websocket session per memberInterviewId

Context:

질문마다 WS 재연결로 지연/끊김이 발생

서버는 memberInterviewId 단위로 세션을 관리하는 구조가 적합

Changes:

WS 연결을 InterviewSessionManager로 단일화

메시지 라우팅 키를 memberInterviewId로 고정

재연결 시 exponential backoff 적용

Impact:

기존 질문 단위 연결 로직 제거됨

서버는 동일 세션 유지 전제로 메시지를 전송해야 함

Tests:

local: interview flow smoke test

unit: session manager reconnect cases


---

## 6) 커밋 크기 가이드
### 6.1 권장 단위
- **feat/fix**: 하나의 사용자 시나리오 단위 (예: “로그인 콜백 처리”)
- **refactor**: 한 모듈/레이어 단위
- **chore/build/ci**: 하나의 목적 단위

### 6.2 분리 기준(혼합 금지)
다음이 섞이면 분리한다.
- 리팩터링 + 기능
- 기능 + 포맷(대량 prettier)
- 버그 수정 + unrelated cleanup

---

## 7) 커밋 시퀀스 패턴(추천)
### 7.1 기능 개발 예시
1) `chore(config): add env template for kakao oauth`
2) `feat(auth): implement kakao oauth redirect flow`
3) `test(auth): add oauth callback handler tests`
4) `docs(auth): document kakao login setup`

### 7.2 리팩터링 예시
1) `refactor(workspace): extract resume repository interface`
2) `refactor(workspace): move upload logic to service layer`
3) `test(workspace): adjust tests for new service boundary`

### 7.3 핫픽스 예시
1) `fix(api): handle null payload in webhook parser`
2) `test(api): add regression test for null payload`

---

## 8) WIP(작업중) 커밋 규칙
WIP 커밋은 **원칙적으로 금지**하되, 아래 경우에만 허용한다.
- 장시간 작업으로 중간 스냅샷이 필요
- 페어/멀티 디바이스 이동
- 긴급 브랜치 전환

포맷:
- `wip(<scope>): <subject>`

조건:
- PR 머지 전에 **squash**하거나 **정리 커밋으로 치환**한다.
- WIP 본문에 TODO를 남겨 AI/사람이 다음 할 일을 알게 한다.

예시:
- `wip(interview): wireframe interview room UI`
  - TODO: connect websocket / finalize layout / add tests

---

## 9) Revert 규칙
- `revert: <원래 커밋 subject>` 를 사용하고 본문에 이유를 남긴다.
- 되돌린 원인(버그/성능/호환성)과 대안 계획을 적는다.

예시:
- `revert: feat(auth): enable silent refresh`
  - Reason: refresh loop in Safari 17
  - Plan: retry policy + storage isolation 후 재도입

---

## 10) 이슈/티켓 연동 규칙 (선택)
이슈 트래킹을 쓰는 경우 본문에 연결한다.

- `Refs: #123`
- `Closes: #123`

또는 JIRA:
- `Refs: PROJ-102`

---

## 11) PR(머지) 권장 정책
- 기본은 **Squash Merge** 권장
  - 브랜치에서 커밋은 작업 단위로 자유롭게 쌓되,
  - main에는 “의도 단위 1커밋”으로 정리되어 AI/사람이 추적하기 쉬움
- 예외: 릴리즈/마이그레이션처럼 단계가 중요한 경우 Rebase merge 고려

---

## 12) 커밋 체크리스트
커밋 전에 아래를 확인한다.
- [ ] 커밋이 하나의 목적만 담는가?
- [ ] subject만 읽고도 변경을 유추 가능한가?
- [ ] 범위가 큰 경우 body에 Context/Changes/Impact/Tests가 있는가?
- [ ] 테스트/빌드가 깨지지 않는가?
- [ ] 대량 포맷은 별도 커밋으로 분리했는가?

---
