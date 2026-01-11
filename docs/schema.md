# schema.md — DB 선택 및 스키마 상세 (MVP)

## 0. 목표

- MVP에서 필요한 기능(사용자/포트폴리오/투자계획/집행결과/알림로그/AI코멘트)을 안정적으로 저장한다.
- Serverless 운영(비용/확장/운영부담 최소)과 스케줄 기반 배치 생성(EventBridge → Lambda)에 적합한 구조를 택한다.
- 추후 멀티 테넌트/다국어/리포트 확장 가능해야 한다.

## 1. DB 선택

### Primary DB: AWS DynamoDB

- 이유
    - Lambda와 자연스러운 결합(서버리스)
    - 스케줄러가 사용자별 작업을 빠르게 스캔/쿼리 가능(GSI 활용)
    - TTL로 인증 토큰/임시 데이터 자동 정리 가능
    - 운영 부담 낮음, 고가용성 기본

### Secondary Storage: S3 (선택)

- 월간 리포트 HTML/PDF 등 스냅샷을 저장할 경우
- 대용량 로그/리포트 파일 저장에 적합

### Observability (비DB)

- CloudWatch Logs: Lambda/API 로그

## 2. 엔티티 요약

- User: 사용자 계정(이메일 중심)
- Portfolio: 종목/비중 세트
- Plan: 월 투자금 + 분할 규칙 + 매수 일정
- Execution: 특정 월/차수의 "주문표" 결과(주수, 이월, 신호)
- NotificationLog: 알림 발송 이력(성공/실패)
- PriceSnapshot: 가격 스냅샷(캐시/재현성)
- (옵션) AIComment: AI 코멘트(Execution에 포함 가능)

## 3. DynamoDB 테이블 설계

> 표기 규칙
> 
- PK: Partition Key
- SK: Sort Key
- GSI: Global Secondary Index
- TTL: 만료 시간(epoch seconds)

### 3.1 users

- 목적: 사용자 기본 정보
- PK: userId (string, uuid)
- Attributes
    - email (string)
    - locale (string) // default: "ko-KR"
    - createdAt (string, ISO)
    - updatedAt (string, ISO)

GSI

- GSI1: emailIndex
    - PK: email (string)
    - SK: userId (string)
    - 목적: 이메일 중복 방지/조회

### 3.2 portfolios

- 목적: 사용자별 포트폴리오(종목/비중)
- PK: userId
- SK: portfolioId (string, uuid)

Attributes

- name (string)
- accountTypes (string[]) // ["ISA","GENERAL","OVERSEAS"]
- markets (string[]) // ["KR","US"]
- themes (string[]) // ["AI_SEMI","ROBOTICS","HEALTHCARE","COPPER","POWER", ...]
- holdings (list)
    - [{ ticker, name, market, targetWeight }]
    - targetWeight: number(0~1), 합계 1.0 권장(서버에서 검증)
- isActive (boolean)
- createdAt, updatedAt

GSI

- GSI1: activePortfolioIndex
    - PK: userId
    - SK: isActive#updatedAt (e.g. "true#2026-01-11T...")
    - 목적: 활성 포트폴리오 빠른 조회

### 3.3 plans

- 목적: 월 투자 계획(금액/분할/일정)
- PK: userId
- SK: planId (string, uuid)

Attributes

- monthlyBudget (number) // KRW 기준
- currency (string) // "KRW" (MVP)
- splitRule (map) // { s1:0.4, s2:0.3, s3:0.3 }
- schedule (map)
    - type: "MONTHLY_DAYS"
    - days: [5, 19] // MVP: 고정 2회 or 확장 3회
    - timezone: "Asia/Seoul"
- cycleCount (number) // 2 or 3
- cycleWeights (number[]) // ex [0.5, 0.5] 또는 [0.4,0.3,0.3]
- notificationChannels (string[]) // ["EMAIL","TELEGRAM"]
- email (string) // 알림 수신 이메일(기본 user.email)
- telegramChatId (string|null)
- isActive (boolean)
- createdAt, updatedAt

GSI

- GSI1: activePlanIndex
    - PK: isActive (string) // "true"
    - SK: nextRunAt (string, ISO)
    - Attributes: userId, planId (프로젝션)
    - 목적: 스케줄러가 "오늘 실행할 대상"을 조회하기 위함

> nextRunAt 계산:
> 
- 스케줄러가 매일 1회 실행하며, nextRunAt <= now 인 플랜을 가져와 처리 후 nextRunAt 갱신.
- 또는 EventBridge를 user별로 만들지 않고 "일일 배치"로 단순화.

### 3.4 executions

- 목적: 특정 월/차수의 주문표 결과(핵심)
- PK: userId
- SK: ymCycle (string) // "2026-02#1" 형태

Attributes

- portfolioId
- planId
- asOfDate (string, ISO) // 가격 기준 시각/일자
- yearMonth (string) // "2026-02"
- cycleIndex (number) // 1..cycleCount
- cycleWeight (number) // 해당 차수 비중(예: 0.4)
- totalBudget (number) // 월 예산
- cycleBudget (number) // 월 예산 * cycleWeight
- items (list)
    - [{
    ticker, name, market,
    price, // number
    targetWeight, // number(0~1)
    targetAmount, // number
    carryIn, // number
    shares, // number (floor)
    estCost, // number = shares*price
    carryOut // number
    }]
- carryByTicker (map) // { "069500": 12345, ... } 다음 차수로 이월
- signals (map)
    - overheatScore (number 0~100)
    - label (string) // "COOL"|"NEUTRAL"|"OVERHEAT"
    - metrics (map) // rsi14, ma20Gap, vol20, pos52w 등 (가능 범위)
- aiComment (string|null) // 옵션
- status (string) // "GENERATED"|"SENT"|"CONFIRMED"
- userConfirm
    - confirmedAt (string|null)
    - note (string|null)
- createdAt, updatedAt

GSI

- GSI1: executionByMonthIndex
    - PK: userId
    - SK: yearMonth#cycleIndex (e.g. "2026-02#1")
    - 목적: 월별 리스트 조회

### 3.5 notification_logs

- 목적: 알림 발송 이력/장애 분석
- PK: userId
- SK: sentAt#type (string) // "2026-02-05T09:00:00+09:00#EMAIL"

Attributes

- executionKey (string) // "2026-02#1"
- channel (string) // EMAIL|TELEGRAM
- to (string) // email or chatId
- status (string) // SUCCESS|FAIL
- errorMessage (string|null)
- createdAt

### 3.6 price_snapshots (선택: 캐시/재현성)

- 목적: 계산 당시 가격을 재현하고 API 호출 비용을 줄임
- PK: marketDate (string) // "KR#2026-02-05"
- SK: ticker (string)

Attributes

- price (number)
- source (string)
- fetchedAt (string, ISO)
- expiresAt (number, TTL) // 예: +7일 또는 +30일

## 4. 데이터 정합성/검증 규칙

- holdings.targetWeight 합계는 1.0±epsilon 검증 (서버)
- cycleWeights 합계는 1.0 검증
- 금액/주수는 음수 금지
- shares는 항상 floor, estCost <= (targetAmount + carryIn)
- carryOut은 0 이상

## 5. 마이그레이션/확장 고려

- v2: 해외(USD) 확장 시 Plan/Execution에 currency별 분리 또는 multi-currency 지원
- v2: 리포트 스냅샷은 S3 + 메타데이터 executions에 저장
- v3: 전문가 의견/컨센서스 데이터는 별도 테이블로 분리 가능
