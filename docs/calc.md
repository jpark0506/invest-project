# calc.md — Execution 계산 로직 설계 (순수 함수 중심)

## 0. 목표

- "주문표(Execution)" 생성에 필요한 핵심 계산을 **순수 함수(pure function)** 로 분리한다.
- 프론트/백엔드 어디서든 동일 로직을 재사용할 수 있도록 입력/출력을 명확히 정의한다.
- 단위 테스트가 쉬운 구조로 만든다.

## 1. 입력/출력 모델

### 1.1 입력 타입(개념)

- monthlyBudget: number (KRW)
- cycleWeight: number (0~1)
- holdings: Holding[]
- prices: Record<ticker, price>
- carryInByTicker: Record<ticker, amount> (없으면 0)
- roundingPolicy:
    - shareRounding: "FLOOR" (MVP 고정)
    - currencyRounding: "NONE" (MVP: 원 단위 그대로)

### 1.2 Holding

- ticker: string
- name: string
- market: "KR" | "US"
- targetWeight: number (0~1)

### 1.3 출력 타입(개념)

- cycleBudget: number
- items: ExecutionItem[]
- carryOutByTicker: Record<ticker, amount>
- totals:
    - totalEstCost: number
    - totalCarryOut: number

### 1.4 ExecutionItem

- ticker, name, market
- price: number
- targetWeight: number
- targetAmount: number
- carryIn: number
- shares: number
- estCost: number
- carryOut: number

## 2. 검증 규칙(Validation)

- holdings.length > 0
- cycleWeight > 0 && cycleWeight <= 1
- monthlyBudget >= 0
- sum(targetWeight) ≈ 1.0 (epsilon 허용: 0.001)
- 모든 ticker에 대해 prices[ticker] 존재해야 함
- price > 0
- carryIn >= 0

검증 실패 시:

- throw ValidationError(code, message, details)

## 3. 계산 규칙(핵심)

### 3.1 차수 예산

- cycleBudget = monthlyBudget * cycleWeight

### 3.2 종목별 목표금액

- targetAmount = cycleBudget * targetWeight

### 3.3 주수 계산(MVP)

- budgetForTicker = targetAmount + carryIn
- shares = floor(budgetForTicker / price)
- estCost = shares * price
- carryOut = budgetForTicker - estCost

제약:

- shares >= 0
- carryOut >= 0
- budgetForTicker < price 인 경우 shares=0, carryOut=budgetForTicker

### 3.4 합산

- totalEstCost = Σ estCost
- totalCarryOut = Σ carryOut

## 4. 순수 함수 구성(권장)

1. validateInputs()
2. computeCycleBudget()
3. computeItems()
4. computeTotals()

## 5. 결정 포인트(향후 확장)

- 소수점 주수 지원 여부(국내 ETF는 보통 1주 단위, 해외는 브로커에 따라 소수점 가능)
    - MVP: 소수점 미지원
- 수수료/세금 반영
    - MVP: 제외
- 현금성 잔액의 "티커별 이월" vs "통합 이월"
    - MVP: 티커별 이월(재현성/예측 가능)

## 6. 테스트 케이스(필수)

- Case A: 정상(가격 충분)
- Case B: 가격이 너무 높아 shares=0
- Case C: carryIn이 있는 경우 다음 차수 carryOut 증가 확인
- Case D: weights 합계가 1.0에서 벗어나는 경우 ValidationError
- Case E: price 누락/0/음수 ValidationError

## 7. 구현 노트

- 금액은 number로 두되, 원 단위 정수만 사용(부동소수 오차 방지 위해 내부적으로 integer 처리 권장)
- targetAmount/cycleBudget는 반올림 정책이 필요할 수 있음
    - MVP: 원 단위 유지, 마지막에 표시만 포맷팅
