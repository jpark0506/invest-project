# apis.md — API Spec (MVP)

## 0. 공통

- Base URL: https://api.example.com
- Content-Type: application/json; charset=utf-8
- Auth:
    - Access Token: Authorization: Bearer <jwt>
    - Refresh Token: HttpOnly Cookie (옵션)
- Timezone: Asia/Seoul
- Locale: ko-KR 기본 (i18n 지원)

## 1. Auth API

### POST /auth/start

- 설명: 이메일로 매직링크 전송
- req:
    - email: string
- res: { ok: true }

### POST /auth/verify

- 설명: 토큰 검증 후 access 발급 + refresh 쿠키 설정
- req:
    - token: string
- res:
    - user: { id: string, email: string, locale: string }
    - accessToken: string

### POST /auth/refresh

- 설명: access 재발급
- req: (cookie refresh)
- res: { accessToken: string }

### POST /auth/logout

- 설명: refresh 폐기
- res: { ok: true }

### GET /me

- auth 필요
- res: { user: { id, email, locale } }

## 2. Portfolio API

### GET /portfolio

- auth 필요
- res:
    - portfolio: {
    portfolioId, name, isActive,
    accountTypes, markets, themes,
    holdings: [{ ticker, name, market, targetWeight }]
    }

### PUT /portfolio

- auth 필요
- req:
    - name?: string
    - accountTypes?: string[]
    - markets?: string[]
    - themes?: string[]
    - holdings?: [{ ticker, name, market, targetWeight }]
    - isActive?: boolean
- res: { portfolio: ... }

## 3. Plan API

### GET /plan

- auth 필요
- res:
    - plan: {
    planId, isActive,
    monthlyBudget, currency,
    cycleCount, cycleWeights,
    schedule: { type, days, timezone },
    notificationChannels, email, telegramChatId
    }

### PUT /plan

- auth 필요
- req:
    - monthlyBudget?: number
    - cycleCount?: number
    - cycleWeights?: number[]
    - schedule?: { type:"MONTHLY_DAYS", days:number[], timezone:string }
    - notificationChannels?: string[]
    - email?: string
    - telegramChatId?: string|null
    - isActive?: boolean
- res: { plan: ... }

## 4. Execution (주문표) API

### GET /executions?ym=YYYY-MM

- auth 필요
- res:
    - executions: [{
    ymCycle, yearMonth, cycleIndex,
    asOfDate, status,
    cycleBudget, signals: { overheatScore, label }
    }]

### GET /executions/{ymCycle}

- auth 필요
- res:
    - execution: {
    ymCycle, yearMonth, cycleIndex, asOfDate,
    portfolioId, planId,
    totalBudget, cycleBudget, cycleWeight,
    items: [{
    ticker, name, market,
    price, targetWeight,
    targetAmount, carryIn,
    shares, estCost, carryOut
    }],
    signals: { overheatScore, label, metrics },
    aiComment,
    status,
    userConfirm: { confirmedAt, note }
    }

### POST /executions/{ymCycle}/confirm

- auth 필요
- 설명: 사용자가 "주문 완료" 체크/메모 저장
- req:
    - note?: string
    - confirmedAt?: string (ISO) // 없으면 서버 now
- res:
    - execution: { ... status:"CONFIRMED", userConfirm: ... }

## 5. Settings / i18n

### PUT /settings/locale

- auth 필요
- req: { locale: "ko-KR" | "en-US" | string }
- res: { ok: true, locale: string }

## 6. Internal (스케줄러 전용)

### POST /internal/run-scheduler

- 내부 호출 전용(서명 or IP 제한)
- 설명: 오늘 실행 대상 플랜 조회 → executions 생성 → 알림 발송
- req:
    - dryRun?: boolean
- res:
    - processed: number
    - succeeded: number
    - failed: number
    - errors?: [{ userId, planId, message }]

## 7. 에러 규격

- HTTP Status Codes:
    - 400: validation error
    - 401: unauthorized
    - 403: forbidden
    - 404: not found
    - 409: conflict
    - 500: server error
- Error body:
{
"error": {
"code": "VALIDATION_ERROR" | "UNAUTHORIZED" | ...,
"message": "human readable message",
"details": { ... optional ... }
}
}
