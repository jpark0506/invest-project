# core.md — 핵심 기능 상세 명세 (MVP)

## 0. MVP 핵심 가치

- 사용자는 "주문은 직접" 한다.
- 시스템은 "계산 + 신호 + 리마인드"를 자동화한다.
- 한국어 우선(ko-KR) + 다국어(i18n) 구조를 MVP부터 적용한다.

---

## 1. 온보딩/설정

### 1.1 사용자 설정

- locale: 기본 ko-KR
- 계좌 유형: ISA/GENERAL/OVERSEAS
- 관심 시장: KR/US(단, MVP는 KR 우선)
- 관심 테마: AI/로봇/헬스케어/원자재/전력 등

### 1.2 포트폴리오 설정

- holdings:
    - ticker, name, market, targetWeight
- 검증:
    - targetWeight 합계 1.0 ± 0.001
    - 음수/NaN 금지
- UX:
    - "예시 포트폴리오"로 시작하되 사용자가 수정 가능

### 1.3 투자 계획(Plan)

- monthlyBudget (KRW)
- cycleCount: 2 또는 3
- cycleWeights: 합계 1.0
- schedule.days: 예) [5, 19]
- 알림 채널: EMAIL/TELEGRAM

---

## 2. 가격 조회(Price Fetch)

### 2.1 목적

- executions 계산에 필요한 "기준 가격" 확보
- MVP는 EOD(일 1회) 또는 매수일 기준 1회 조회로 충분

### 2.2 캐시

- price_snapshots 사용(선택)
- 동일 날짜/티커는 재사용하여 외부 API 호출 최소화

---

## 3. 주수 배정(핵심 계산)

### 3.1 입력

- monthlyBudget
- cycleWeight (이번 차수)
- holdings(targetWeight)
- prices(ticker->price)
- carryInByTicker (이전 이월)

### 3.2 계산 규칙

- cycleBudget = monthlyBudget * cycleWeight
- 종목별 목표금액:
    - targetAmount = cycleBudget * targetWeight
- 종목별 권장주수:
    - shares = floor((targetAmount + carryIn) / price)
- 추정 집행액:
    - estCost = shares * price
- 이월:
    - carryOut = (targetAmount + carryIn) - estCost
- 제약:
    - shares >= 0
    - carryOut >= 0

### 3.3 출력

- Execution.items[] 전부
- carryByTicker 업데이트
- cycleBudget 대비 잔액 합산 표시(UX)

---

## 4. 신호 분석(과열 점수)

### 4.1 목적

- "행동 지시"가 아닌 "지표 기반 신호" 제공

### 4.2 MVP 지표(가능한 범위)

- RSI14 (가능하면)
- MA20 이격 (가능하면)
- 52주 위치 (가능하면)
- 최소 구현:
    - 단일 지표(예: MA20 이격) 기반 3단계 라벨도 허용

### 4.3 출력

- overheatScore 0~100
- label: COOL / NEUTRAL / OVERHEAT

### 4.4 UI 문구(필수)

- "참고용 신호이며 투자 판단 책임은 사용자에게 있습니다."
- "일부 투자자는 분할 매수 비중을 조정하기도 합니다."

---

## 5. AI 코멘트(옵션)

### 5.1 호출 조건(비용 통제)

- 매수일 자동 생성 시 1회/유저 또는 사용자가 버튼 클릭 시

### 5.2 입력 최소화

- 지표 값 + 점수 + 종목 리스트만 전달
- OHLC 원본 금지

### 5.3 출력 규칙

- 2~4문장
- 근거 지표 2개 이상
- 단정 금지(수익/확신 표현 금지)
- 선택지 형태로만 제시

---

## 6. 알림(메일/텔레그램)

### 6.1 트리거

- schedule.days에 맞춰 오전 9시(Asia/Seoul)

### 6.2 메시지 구성

- 오늘 차수 + 비중
- 종목별: 현재가/목표금액/주수/예상집행액/이월금
- 신호 요약(점수 + 라벨)
- 대시보드 링크

### 6.3 로깅

- notification_logs에 SUCCESS/FAIL 기록

---

## 7. 주문 완료 확인(Confirm)

- 사용자는 실제 주문 후 "주문 완료" 체크
- confirmedAt, note 저장
- status = CONFIRMED

---

## 8. 다국어(i18n) 요구사항

- MVP는 한국어(ko-KR)로 제공
- 모든 문자열은 i18n 레이어로 관리(컴포넌트 하드코딩 금지)
- 최소 지원:
    - ko-KR (default)
    - en-US (키/파일만 만들어 두고 문구는 추후 채움)

---

## 9. MVP 성공 기준

- 알림 클릭률
- 주문표 조회율
- Confirm 비율
- 다음 달 재사용(4주 리텐션)
