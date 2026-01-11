# structure.md — Project Structure (FSD, MVP)

## 0. 설계 원칙 (FSD)

- Frontend는 **Feature-Sliced Design(FSD)** 레이어를 따른다.
    - app → processes → pages → widgets → features → entities → shared
- 모든 UI 문자열은 i18n 레이어(shared)에만 존재한다.
- 계산/시그널 로직은 **프레임워크 독립**으로 유지한다.
    - FE/BE 공통 재사용을 위해 `packages/core`에 위치
- Backend는 UI 중심 설계가 아니므로 FSD를 그대로 강제하지 않고,
**도메인 모듈 단위**로 구성하되 FE의 entities/features 명명과 정합을 맞춘다.

---

## 1. Repository Top-level

```
invest-assist/
├── apps/
│   └── web/                  # React SPA (FSD)
├── services/
│   └── api/                  # Backend (Lambda, domain modules)
├── packages/
│   └── core/                 # framework-agnostic core (calc/signals/models)
├── infra/                    # IaC (SAM / Serverless / Terraform)
├── docs/                     # specs & design docs
└── .github/
    └── workflows/            # CI/CD
```

## 2. Frontend — apps/web (React SPA, FSD)

```
apps/web/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── app/
│   │   ├── providers/         # QueryClientProvider, Router, i18n init, Auth init
│   │   ├── routes/            # route definitions
│   │   ├── styles/
│   │   └── index.tsx          # app bootstrap
│   │
│   ├── processes/             # cross-page processes
│   │   └── auth/              # auth session init, refresh orchestration
│   │
│   ├── pages/
│   │   ├── auth-callback/
│   │   │   └── ui/
│   │   ├── dashboard/
│   │   │   └── ui/
│   │   ├── execution/
│   │   │   └── ui/            # /execution/:ymCycle
│   │   └── settings/
│   │       └── ui/
│   │
│   ├── widgets/
│   │   ├── dashboard-summary/
│   │   │   └── ui/
│   │   ├── execution-table/
│   │   │   └── ui/
│   │   └── settings-panel/
│   │       └── ui/
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login-by-email/
│   │   │   │   ├── ui/
│   │   │   │   └── model/
│   │   │   ├── verify-magic-link/
│   │   │   │   ├── ui/
│   │   │   │   └── model/
│   │   │   └── logout/
│   │   │       ├── ui/
│   │   │       └── model/
│   │   │
│   │   ├── portfolio/
│   │   │   └── edit-portfolio/
│   │   │       ├── ui/
│   │   │       └── model/
│   │   │
│   │   ├── plan/
│   │   │   └── edit-plan/
│   │   │       ├── ui/
│   │   │       └── model/
│   │   │
│   │   └── execution/
│   │       └── confirm-execution/
│   │           ├── ui/
│   │           └── model/
│   │
│   ├── entities/
│   │   ├── user/
│   │   │   ├── api/
│   │   │   ├── model/
│   │   │   └── lib/
│   │   ├── portfolio/
│   │   │   ├── api/
│   │   │   ├── model/
│   │   │   └── lib/
│   │   ├── plan/
│   │   │   ├── api/
│   │   │   ├── model/
│   │   │   └── lib/
│   │   └── execution/
│   │       ├── api/
│   │       ├── model/
│   │       └── lib/
│   │
│   ├── shared/
│   │   ├── api/               # http client, interceptors, auth refresh
│   │   ├── config/            # env, constants
│   │   ├── i18n/              # ko-KR.json, en-US.json
│   │   ├── lib/               # date, money, validators
│   │   ├── ui/                # buttons, inputs, layouts
│   │   └── types/
│   │
│   └── main.tsx
├── vite.config.ts
└── package.json
```

### FE 레이어 책임 요약

- pages: 라우트 단위 화면 (데이터 조합)
- widgets: 페이지에서 재사용되는 큰 UI 블록
- features: 사용자 액션/유즈케이스 단위
- entities: 도메인 모델 + API + 상태
- shared: 전역 유틸, UI, i18n, http

## 3. Core Logic — packages/core (공통, 프레임워크 독립)

```
packages/core/
├── src/
│   ├── calc/
│   │   ├── calculateExecution.ts
│   │   ├── validators.ts
│   │   └── types.ts
│   ├── signals/
│   │   ├── computeOverheat.ts
│   │   └── types.ts
│   ├── models/
│   │   ├── portfolio.ts
│   │   ├── plan.ts
│   │   └── execution.ts
│   └── index.ts
└── tests/
    └── calc.spec.ts
```

- FE에서는 entities/*/lib 또는 shared/lib에서 import
- BE에서도 동일 로직 재사용 가능

## 4. Backend — services/api (도메인 모듈 구조)

```
services/api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── handlers/
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   └── types.ts
│   │   ├── user/
│   │   │   ├── handlers/
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   └── types.ts
│   │   ├── portfolio/
│   │   │   ├── handlers/
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   └── types.ts
│   │   ├── plan/
│   │   │   ├── handlers/
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   └── types.ts
│   │   ├── execution/
│   │   │   ├── handlers/
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   └── types.ts
│   │   └── scheduler/
│   │       ├── handlers/
│   │       ├── service.ts
│   │       ├── priceFetcher.ts
│   │       └── notification.ts
│   │
│   ├── shared/
│   │   ├── db.ts
│   │   ├── secrets.ts
│   │   ├── jwt.ts
│   │   ├── middleware/
│   │   │   └── requireAuth.ts
│   │   └── logger.ts
│   └── index.ts
├── template.yaml
└── package.json
```

## 5. Docs — docs/

```
docs/
├── main.md
├── architecture.md
├── schema.md
├── apis.md
├── core.md
├── auth.md
├── calc.md
├── scheduler.md
├── react-state.md
├── mvp-scope-trim.md
├── release.md
└── structure.md
```

## 6. 문서 ↔ 코드 매핑 규칙

- apis.md ↔ FE entities/*/api + BE modules/*/handlers
- schema.md ↔ BE modules/*/repo
- core.md / calc.md ↔ packages/core + BE service.ts
- auth.md ↔ FE features/auth + BE modules/auth

## 7. MVP 구현 순서(권장)

1. packages/core: calculateExecution + tests
2. Backend auth → /me
3. Backend portfolio/plan CRUD
4. Scheduler → executions 생성
5. Web dashboard + execution detail
6. Confirm feature + settings
