# architecture.md — System Architecture (MVP)

## 0. 개요

- Frontend: React SPA (Vite) + PWA
- Backend: API Gateway + Lambda (REST)
- DB: DynamoDB (+ S3 optional)
- Scheduler/Notification: EventBridge + Lambda + SES/Telegram

## 1. 구성 요소

### 1) Frontend (React SPA)

- 주요 역할:
    - 온보딩/설정(포트폴리오/플랜)
    - 주문표(Execution) 조회 및 확인(Confirm)
    - 신호/AI 코멘트 표시
- 배포:
    - S3 Static Hosting + CloudFront (권장)
    - PWA: manifest + service worker

### 2) API Layer

- API Gateway (REST)
- Lambda Functions (서로 분리 권장):
    - auth-service: /auth/*
    - user-service: /me, /settings/*
    - portfolio-service: /portfolio
    - plan-service: /plan
    - execution-service: /executions/*
    - internal-scheduler: /internal/run-scheduler

### 3) Data Layer

- DynamoDB: users, portfolios, plans, executions, notification_logs, (optional) price_snapshots
- S3 (optional): 리포트 스냅샷 저장

### 4) Scheduler & Notification

- EventBridge: 매일(또는 매수일) 오전 9시 트리거
- Scheduler Lambda:
    1. activePlanIndex로 실행 대상 조회
    2. 가격 조회/캐시(price_snapshots)
    3. 주수 계산 후 executions upsert
    4. 신호 계산(과열 점수)
    5. (옵션) LLM 코멘트 생성
    6. SES/Telegram 발송
    7. notification_logs 기록

## 2. 데이터 흐름

### A) 사용자가 포트/플랜 설정

React → API Gateway → Lambda → DynamoDB

### B) 매수일 자동 주문표 생성

EventBridge → Scheduler Lambda → (Price API) → DynamoDB(executions) → SES/Telegram → notification_logs

### C) 사용자가 주문 완료 체크

React → API Gateway → Lambda → DynamoDB(executions.status=CONFIRMED)

## 3. 보안 설계(요약)

- Auth: 이메일 매직링크 + Access JWT + Refresh 쿠키
- Secrets: Secrets Manager
- Internal endpoint: 서명된 요청 또는 API Key + WAF/IP 제한
- PII 최소화: 이메일만(기본)
- Audit: CloudWatch Logs + notification_logs

## 4. 확장 계획

- v2: AI 코멘트 온디맨드(사용자 클릭 시)
- v2: 리포트 스냅샷(S3)
- v3: 전문가 의견/컨센서스(가능한 시장부터)
- v3: multi-currency & 해외 시장 확대
