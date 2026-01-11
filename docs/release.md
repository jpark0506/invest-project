# release.md — CI/CD & Deployment Plan (MVP)

## 0. 목표

- FE/BE를 각각 독립적으로 배포한다.
- PR 단위 검증(테스트/린트) + main merge 시 자동 배포.
- 환경 분리: dev / prod

---

## 1. Frontend (React SPA)

### Repo 구조(권장)

- /apps/web (React)
- /services/* (lambda) 또는 별도 repo도 가능

### 빌드/배포

- Build: Vite build
- Hosting: S3 + CloudFront
- Deploy:
    - GitHub Actions
        - main merge → S3 sync → CloudFront invalidation
- 환경 변수:
    - VITE_API_BASE_URL
    - VITE_DEFAULT_LOCALE=ko-KR

### 품질 게이트

- eslint
- typecheck (tsc --noEmit)
- unit tests (선택)

---

## 2. Backend (Lambda)

### IaC 권장

- AWS SAM 또는 Serverless Framework 또는 Terraform 중 1개 선택
- MVP는 SAM이 단순 (템플릿 관리 용이)

### 배포 파이프라인

- GitHub Actions
    - main merge → build → package → deploy (dev/prod 분리)
- Stages:
    - dev: feature 검증용
    - prod: 안정 배포

### 배포 단위

- 함수별 배포 또는 스택 단위 배포
- 권장: 스택 단위(버전 정합성 유지)

### 버전/롤백

- Lambda alias (dev/prod)
- 실패 시 이전 배포로 롤백

---

## 3. 데이터/마이그레이션

- DynamoDB는 스키마 마이그레이션이 제한적이므로:
    - item versioning (schemaVersion)
    - backward compatible 변경 원칙
- TTL 기반 테이블(auth_tokens 등)은 IaC로 설정

---

## 4. 릴리즈 체크리스트

- [ ]  API Base URL prod 적용
- [ ]  Secrets Manager 키 설정
- [ ]  SES 발신 도메인/이메일 검증(사용 시)
- [ ]  CloudFront 캐시 정책 확인
- [ ]  알림 스케줄(Asia/Seoul) 확인
- [ ]  로그/알람(실패율) 설정
