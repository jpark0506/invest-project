# authentication.md — Authentication (MVP)

## 0. 목표

- React SPA + Serverless(API Gateway + Lambda) 환경에서 안전하고 구현 난이도가 낮은 인증을 제공한다.
- 비밀번호 저장/관리 없이 로그인한다.
- Access Token은 짧게, Refresh Token은 서버에서 회수 가능하게 관리한다.
- 인증은 "웹에서 조회/수정"에만 사용한다. (스케줄러/알림 파이프라인은 인증 불필요)

## 1. 인증 방식(선택)

### MVP 선택: 이메일 매직링크 + Access JWT + Refresh Token(쿠키)

- 이메일로 1회용 로그인 링크 발송(유효기간 10~15분)
- 검증 성공 시:
    - Access Token(JWT) 발급(15~30분)
    - Refresh Token 발급(14~30일, 서버 저장/회수 가능)
- Refresh Token은 HttpOnly 쿠키로만 전달/저장

## 2. 보안 원칙

- 비밀번호 수집/저장 금지
- 매직링크 토큰은 평문 저장 금지(해시 저장)
- Refresh Token은 JS에서 접근 불가(HttpOnly Secure 쿠키)
- Access Token은 프론트 메모리 저장(새로고침 시 refresh로 재발급)
- Refresh 토큰 로테이션 권장(갱신 시 새 refresh 발급 + 기존 폐기)
- CSRF 방어:
    - Refresh 엔드포인트는 쿠키 기반이므로 CSRF 고려 필요
    - SameSite=Lax/Strict 적용 + (필요 시) Double Submit CSRF 토큰
- XSS 방어:
    - refresh 쿠키 HttpOnly로 XSS 시 refresh 탈취 방지
    - CSP/입력 검증/출력 인코딩 기본 적용

## 3. API 엔드포인트 (MVP)

### 3.1 POST /auth/start

- 목적: 이메일로 매직링크 전송
- req: { "email": "user@example.com" }
- res: { "ok": true }
- 처리:
    1. email normalize(lowercase/trim)
    2. nonce/token 생성(충분히 긴 랜덤)
    3. tokenHash = hash(token)
    4. auth_tokens에 저장(TTL 10~15분)
    5. SES/SMTP로 링크 발송:
    https://app.example.com/auth/callback?token=<token>

### 3.2 POST /auth/verify

- 목적: 매직링크 토큰 검증 후 세션 발급
- req: { "token": "<token-from-link>" }
- res:
    - Body: { "user": { "id": "...", "email": "..." }, "accessToken": "<jwt>" }
    - Header: Set-Cookie: refresh=<refresh>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...
- 처리:
    1. tokenHash = hash(token)
    2. auth_tokens에서 tokenHash 조회 + 만료 확인
    3. user upsert(users)
    4. refresh 생성(랜덤) + refreshHash 저장 + TTL 14~30일
    5. access JWT 생성(sub=userId, exp=15~30분)
    6. auth_tokens 삭제(1회성)

### 3.3 POST /auth/refresh

- 목적: access 만료 시 재발급
- req: (쿠키 refresh 자동 포함)
- res:
    - Body: { "accessToken": "<jwt>" }
    - (옵션) refresh rotation 시 Set-Cookie로 새 refresh 발급
- 처리:
    1. cookie refresh 읽기
    2. refreshHash로 DB 조회 + revoked 여부 확인
    3. 유효하면 access JWT 재발급
    4. (권장) refresh rotation:
        - 새 refresh 발급 + 기존 refresh revokedAt 설정 + 새 refresh 저장

### 3.4 POST /auth/logout

- 목적: 서버에서 refresh 폐기
- req: (쿠키 refresh)
- res: { "ok": true } + Set-Cookie refresh 삭제
- 처리:
    1. refreshHash 조회 후 revokedAt 설정
    2. refresh 쿠키 만료

### 3.5 GET /me (선택)

- 목적: 현재 로그인 사용자 정보
- req: Authorization: Bearer <access>
- res: { "user": { ... } }

## 4. DynamoDB 테이블 설계(최소)

### 4.1 users

- PK: userId (string, uuid)
- attrs:
    - email (string, unique 처리 필요: emailIndex 권장)
    - createdAt, updatedAt

권장: GSI

- GSI1: email -> userId (email unique upsert용)

### 4.2 auth_tokens (매직링크)

- PK: tokenHash (string)
- attrs:
    - email
    - expiresAt (number, TTL)
    - createdAt

### 4.3 refresh_tokens

- PK: tokenId (string, uuid)
- attrs:
    - userId
    - tokenHash
    - expiresAt (TTL)
    - createdAt
    - revokedAt? (nullable)

권장: GSI

- GSI1: tokenHash -> tokenId (refresh 조회용)
- GSI2: userId -> tokenId (사용자 전체 세션 관리/강제 로그아웃용)

## 5. JWT 정책

- access JWT claims:
    - sub: userId
    - iat, exp
    - iss, aud (선택)
- 서명: HS256(Secret Manager) 또는 RS256(KMS/키관리)
- exp: 15~30분
- scope/role: MVP는 생략 가능

## 6. 프론트 저장 전략(React)

- accessToken: 메모리(상태 관리) 보관
- 앱 로드시 /me 호출이 실패하면 /auth/refresh 호출로 access 재발급
- refresh는 쿠키 기반으로 자동 전송(프론트에서 접근 불가)

## 7. 위협 모델 체크리스트

- XSS: refresh HttpOnly, CSP 적용, 사용자 입력 검증
- CSRF: refresh 엔드포인트 SameSite + (필요 시) CSRF 토큰
- 토큰 유출: auth_tokens/refresh_tokens는 해시 저장
- 재사용 공격: 매직링크 토큰 1회성(verify 후 삭제)
- 세션 회수: logout 및 사용자 단위 강제 revoke 가능

## 8. MVP 판단

- OAuth(구글/카카오)는 v2에서 추가 가능
- 초기 MVP는 이메일 매직링크로 "가장 빠른 출시" 목표
