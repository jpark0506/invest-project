# planning.md — 2주 개발 계획

## 0. 결정 사항

- **가격 API**: 네이버 금융 (크롤링/API)
- **AWS**: DynamoDB, SES, Lambda, EventBridge 사용 가능
- **SES 도메인**: 미정 (MVP 초기는 검증된 이메일로 테스트)
- **UI 스타일**: 토스(Toss) 스타일 — 미니멀, 큰 타이포, 충분한 여백, 부드러운 애니메이션

---

## 1. 작업 단위 목록

| ID | 작업명 | 설명 | 난이도 | 담당 |
|---|---|---|---|---|
| **P1** | 프로젝트 초기 설정 | monorepo 구조, TypeScript, ESLint, Vitest | M | Claude |
| **P2** | packages/core 계산 로직 | calculateExecution 순수 함수 + 타입 | S | Claude |
| **P3** | packages/core 테스트 | calc.spec.ts | S | Claude |
| **B1** | Backend 스캐폴딩 | services/api 구조, SAM 템플릿 | M | Claude |
| **B2** | Auth 모듈 | 매직링크 + JWT | L | Claude → 사람 검토 |
| **B3** | User 모듈 | /me 엔드포인트 | S | Claude |
| **B4** | Portfolio 모듈 | GET/PUT /portfolio | M | Claude |
| **B5** | Plan 모듈 | GET/PUT /plan | M | Claude |
| **B6** | Execution 모듈 | executions CRUD + confirm | M | Claude |
| **B7** | Scheduler Lambda | 가격 조회 + execution 생성 + 알림 | L | Claude → 사람 검토 |
| **B8** | 알림 모듈 | SES 발송 + notification_logs | M | Claude |
| **F1** | Frontend 스캐폴딩 | Vite + React + FSD + i18n | M | Claude |
| **F2** | shared 레이어 | HTTP 클라이언트, 토스 스타일 UI | M | Claude |
| **F3** | Auth 기능 | 로그인/콜백/세션 | M | Claude |
| **F4** | Settings 페이지 | 포트폴리오/플랜 설정 | M | Claude |
| **F5** | Dashboard 페이지 | 주문표 리스트 | S | Claude |
| **F6** | Execution Detail | 상세 + Confirm | M | Claude |
| **I1** | AWS 인프라 | DynamoDB, SES, Secrets Manager | L | 사람 (Claude IaC 제공) |
| **I2** | CI/CD | GitHub Actions | M | Claude |

---

## 2. 의존성 그래프

```
P1 ─────┬───────────────────────────────────────────┐
        │                                           │
        ▼                                           ▼
       P2 ──▶ P3                                   F1 ──▶ F2 ──▶ F3 ──▶ F4
        │                                                          │
        ▼                                                          ▼
       B1 ──▶ B2 ──▶ B3 ──▶ B4 ──▶ B5 ──▶ B6 ──▶ B7 ──▶ B8       F5 ──▶ F6
        │
        ▼
       I1 ──▶ I2
```

---

## 3. Week 1 목표

### Day 1-2: 기반 구축
- [ ] P1: 프로젝트 초기 설정
- [ ] P2: packages/core 계산 로직
- [ ] P3: packages/core 테스트

### Day 3-4: Backend 기반
- [ ] B1: Backend 스캐폴딩
- [ ] B2: Auth 모듈

### Day 5-7: Backend CRUD + Frontend 시작
- [ ] B3: User 모듈
- [ ] B4: Portfolio 모듈
- [ ] B5: Plan 모듈
- [ ] F1: Frontend 스캐폴딩

---

## 4. Week 2 목표

### Day 8-10: Backend 완성
- [ ] B6: Execution 모듈
- [ ] B7: Scheduler Lambda
- [ ] B8: 알림 모듈

### Day 11-14: Frontend 완성 + 통합
- [ ] F2: shared 레이어
- [ ] F3: Auth 기능
- [ ] F4: Settings 페이지
- [ ] F5: Dashboard 페이지
- [ ] F6: Execution Detail
- [ ] I1: AWS 인프라
- [ ] I2: CI/CD

---

## 5. 기술 스택 확정

### Frontend
- React 18 + TypeScript
- Vite
- React Router v6
- TanStack Query (React Query)
- Zustand (경량 상태관리)
- Tailwind CSS (토스 스타일 커스텀)
- react-i18next

### Backend
- Node.js 20 + TypeScript
- AWS Lambda (ESM)
- API Gateway (REST)
- DynamoDB
- SES
- EventBridge

### Shared
- pnpm workspaces (monorepo)
- Vitest
- ESLint + Prettier

---

## 6. 네이버 가격 API 전략

### 접근 방식
- 네이버 금융 시세 페이지 크롤링 또는 비공식 API 활용
- URL 패턴: `https://finance.naver.com/item/main.nhn?code={ticker}`
- 또는 JSON API: `https://api.finance.naver.com/siseJson.naver`

### 캐시 전략
- price_snapshots 테이블에 일별 캐시
- 동일 날짜 재요청 시 캐시 반환
- TTL: 7일

---

## 7. 토스 스타일 UI 가이드

### 컬러
- Primary: #3182F6 (토스 블루)
- Background: #F4F5F7
- Surface: #FFFFFF
- Text Primary: #191F28
- Text Secondary: #8B95A1
- Success: #00C853
- Warning: #FF9100
- Error: #F44336

### 타이포그래피
- 제목: 24-32px, font-weight: 700
- 본문: 15-17px, font-weight: 400
- 캡션: 13px, font-weight: 400

### 간격
- 기본 단위: 4px
- 섹션 간격: 24-32px
- 카드 패딩: 20px
- 버튼 높이: 52px

### 컴포넌트
- 카드: border-radius 16px, 그림자 최소
- 버튼: border-radius 12px, 풀 너비 선호
- 인풋: border-radius 12px, 44-52px 높이
