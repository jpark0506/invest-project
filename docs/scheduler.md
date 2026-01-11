# scheduler.md — Scheduler Lambda 의사코드/동작 정의

## 0. 목표

- 매수일(또는 매일 1회) 스케줄 실행을 통해 자동으로 Execution을 생성하고 알림을 발송한다.
- 사용자 인증(JWT)은 필요 없으며, 내부 호출로만 실행된다.
- 실패/재시도/로깅이 명확해야 한다.

## 1. 트리거 방식(권장)

### MVP 권장: EventBridge "매일 오전 9시" 1회 실행

- timezone: Asia/Seoul
- Lambda에서 오늘이 플랜의 schedule.days에 해당하는지 판단
- 장점:
    - EventBridge 룰을 사용자별로 만들 필요 없음
    - 운영 단순
    - 플랜 변경 시 별도 스케줄 관리 불필요

## 2. 입력/출력

### 입력

- dryRun?: boolean (기본 false)

### 출력

- processed: number
- succeeded: number
- failed: number
- errors: [{ userId, planId, message }]

## 3. 처리 단계(고수준)

1. 오늘 날짜 계산(Asia/Seoul)
2. 활성 플랜 조회(plans.activePlanIndex 또는 scan+filter)
3. 각 플랜에 대해:
    - 오늘이 실행 대상인지 판정
    - portfolio/plans 로드
    - 가격 조회(캐시 우선)
    - carryIn 조회(전 차수 execution에서 carryOut)
    - calc 로직으로 execution 생성
    - signals 계산(과열 점수)
    - (옵션) aiComment 생성
    - executions upsert
    - 알림 발송(메일/텔레그램)
    - notification_logs 기록
4. 플랜의 nextRunAt 갱신(선택, 도입 시)
5. 결과 집계 반환

## 4. 의사코드

```
handler(event):
  now = nowInSeoul()
  todayDay = dayOfMonth(now)            // 예: 5, 19
  yearMonth = formatYYYYMM(now)         // "2026-02"

  plans = queryActivePlans()            // isActive=true

  processed = 0; succeeded = 0; failed = 0; errors = []

  for plan in plans:
    if !isRunDay(plan.schedule, todayDay):
       continue

    processed++

    try:
      userId = plan.userId
      portfolio = getActivePortfolio(userId)
      assert portfolio != null

      cycleIndex = computeCycleIndex(plan.schedule.days, todayDay)
      cycleWeight = plan.cycleWeights[cycleIndex-1]

      // 1) 가격
      tickers = portfolio.holdings.ticker[]
      prices = getPrices(tickers, now)        // cache-first, fallback external API

      // 2) carryIn
      carryInByTicker = {}
      if cycleIndex == 1:
         carryInByTicker = {}                // 0
      else:
         prevKey = yearMonth + "#" + (cycleIndex-1)
         prevExec = getExecution(userId, prevKey)
         carryInByTicker = prevExec.carryByTicker or {}

      // 3) 계산(순수 함수)
      calcOut = calculateExecution({
        monthlyBudget: plan.monthlyBudget,
        cycleWeight,
        holdings: portfolio.holdings,
        prices,
        carryInByTicker
      })

      // 4) 신호
      signals = computeSignals(tickers, now)  // 가능 범위에서

      // 5) AI 코멘트(옵션)
      aiComment = null
      if shouldGenerateAI(plan, now):
         aiComment = generateLLMComment(calcOut, signals, locale="ko-KR")

      // 6) executions upsert
      execKey = yearMonth + "#" + cycleIndex
      execution = buildExecutionItem(plan, portfolio, now, cycleIndex, calcOut, signals, aiComment)
      saveExecution(userId, execKey, execution)

      // 7) 알림
      if !event.dryRun:
        sendNotifications(plan, execution)
      logNotification(userId, execKey, status="SUCCESS")

      succeeded++

    catch err:
      failed++
      errors.push({ userId: plan.userId, planId: plan.planId, message: err.message })
      logNotification(plan.userId, execKey?, status="FAIL", errorMessage=err.message)

  return { processed, succeeded, failed, errors }

```
