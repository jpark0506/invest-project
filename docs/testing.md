# testing.md — Local Testing Strategy (Lambda + React, MVP)

## 0. 목표
- Lambda(Serverless) 기반이어도 **로컬에서 충분히 빠르고 안정적으로 테스트**할 수 있게 한다.
- 테스트를 3계층(Unit / Contract / Integration)으로 나눠 **AWS 의존성을 최소화**한다.
- CI에서 재현 가능한 방식으로 구성한다.

---

## 1. 테스트 계층 설계

### 1) Unit Test (필수)
- 대상:
  - `packages/core/src/calc/*`
  - `packages/core/src/signals/*` (가능 범위)
  - `services/api/src/modules/*/service.ts`
- 특징:
  - 외부 I/O 없음 (DB/HTTP/시간 의존성 제거)
  - 빠르고 안정적
- 목표:
  - 계산 로직, 검증 로직, 도메인 규칙을 확정한다.

### 2) Contract Test (필수)
- 대상:
  - `services/api/src/modules/*/handlers/*`
- 특징:
  - API Gateway event mock → handler 호출 → 응답(statusCode/body/headers) 검증
  - DB는 mock 또는 인메모리 fake
- 목표:
  - `apis.md`에 정의된 스펙대로 통신이 되는지 보장한다.

### 3) Integration Test (선택)
- 대상:
  - DynamoDB Local(로컬)과 실제 repo 연동
  - Scheduler 흐름(가격 조회는 mock) + execution 저장/조회
- 특징:
  - 속도는 느리지만, 실제 저장/조회/인덱스 동작을 검증할 수 있음
- 목표:
  - DynamoDB 테이블/쿼리/GSI/TTL 등 실동작 검증

---

## 2. 권장 도구
- Test runner: **Vitest** (Node + TS 환경에 적합)
- HTTP/handler contract: event mock 기반 직접 호출
- DynamoDB Local: Docker
- (선택) SAM CLI: 로컬 API Gateway + Lambda 실행

---

## 3. 폴더/파일 구조(권장)

```text
packages/core/
├── src/
└── tests/
    ├── calc.spec.ts
    └── signals.spec.ts

services/api/
├── src/
│   ├── modules/
│   │   ├── execution/
│   │   │   ├── handlers/
│   │   │   │   ├── detail.spec.ts
│   │   │   │   └── confirm.spec.ts
│   │   │   ├── service.spec.ts
│   │   │   └── repo.spec.ts (optional)
│   │   └── ...
│   └── shared/
└── tests/
    └── integration/
        ├── dynamodb-local.spec.ts
        └── scheduler-flow.spec.ts
4. Unit Test 가이드
4.1 packages/core 계산 로직 테스트

입력/출력 기반으로 검증:

정상 케이스

price가 너무 커서 shares=0

carryIn 적용

weights 합계 오류

price 누락/0/음수 오류

4.2 서비스 레이어 테스트

Repo는 mock 처리

검증 포인트:

요청 검증(ValidationError)

도메인 규칙(가중치/차수/이월 처리)

상태 전이(execution.status)

5. Contract Test (Handler 테스트) 가이드
5.1 목표

handler가 API Gateway 이벤트를 받아:

statusCode

headers

body(JSON)
를 올바르게 반환하는지 검증

5.2 Event mock 유틸(권장)

services/api/src/shared/test/apiGwEvent.ts 생성 권장

예시(개념):

method, path, headers, body, pathParameters, queryStringParameters

auth 필요 핸들러는 Authorization: Bearer ...를 주입

검증 포인트:

200 성공 시 body schema

400 validation error

401 unauthorized

404 not found

6. DynamoDB Local (Integration Test)
6.1 docker-compose 예시

프로젝트 루트 또는 services/api/에 두고 사용

version: "3.8"
services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: dynamodb-local
    command: "-jar DynamoDBLocal.jar -sharedDb -inMemory"
    ports:
      - "8000:8000"


실행:

docker compose up -d dynamodb-local


종료:

docker compose down

6.2 로컬 DynamoDB 연결 설정

환경 변수 예시:

DDB_ENDPOINT=http://localhost:8000

AWS_REGION=ap-northeast-2

AWS_ACCESS_KEY_ID=local

AWS_SECRET_ACCESS_KEY=local

DynamoDB Local은 자격증명을 실제로 검증하지 않지만 SDK 구동을 위해 필요합니다.

6.3 테이블 생성(테스트용)

권장 방식:

테스트 실행 전 createTables()를 코드로 수행

테스트 종료 시 deleteTables() 수행

또는:

Local에서 sharedDb를 쓰므로 테스트 격리 위해 tableName에 suffix 사용:

users_test_${runId}

7. Scheduler 테스트 전략
7.1 Unit 수준 (권장)

scheduler/service.ts를 함수로 분리:

runScheduler({ now, dryRun })

의존성 주입:

priceFetcher(외부 API) → mock

notificationSender(SES/Telegram) → mock

repositories → dynamodb-local 또는 mock

7.2 Integration 수준(선택)

dynamodb-local 사용

시나리오:

user/portfolio/plan seed

now를 “매수일 09:00 KST”로 고정

priceFetcher mock으로 가격 제공

runScheduler 실행

executions 생성 확인 + notification_logs 기록 확인

8. 로컬에서 Lambda 실행(선택)
8.1 SAM CLI

장점: API Gateway 이벤트를 실제에 가깝게 재현

예:

sam build
sam local start-api --port 3001


FE에서:

VITE_API_BASE_URL=http://localhost:3001

MVP에서는 “handler contract test + unit test”만으로도 충분하며,
SAM local은 “실제 동작 확인용”으로 선택 적용해도 됩니다.

9. CI (GitHub Actions) 권장 구성
9.1 FE

eslint

tsc --noEmit

vitest

9.2 BE

eslint

tsc --noEmit

vitest

(선택) integration:

dynamodb-local 컨테이너 띄우고 integration test 수행

10. 체크리스트 (실수 방지)

 계산 로직은 packages/core에만 존재 (중복 구현 금지)

 handler는 파싱/응답만 담당, 비즈니스는 service로 이동

 repo만 AWS SDK 사용

 시간(now)은 주입 가능하도록(테스트 가능)

 scheduler는 멱등성(중복 실행) 방지 로직 존재

 API 응답은 apis.md와 동일(Contract Test로 보장)



::contentReference[oaicite:0]{index=0}