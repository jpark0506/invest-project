# Deployment Guide

## 프로젝트 구조

- **Frontend**: `apps/web` - Vite + React (Vercel 배포)
- **Backend**: `services/api` - AWS SAM + Lambda (GitHub Actions 자동 배포)

---

## Vercel 배포 (Frontend)

### 1. Vercel 프로젝트 설정

Vercel 대시보드에서:

1. **Settings → General**
   - **Root Directory**: `apps/web` ⚠️ 중요!
   - **Framework Preset**: `Vite`
   - **Build Command**: `pnpm build` (또는 기본값)
   - **Output Directory**: `dist` (또는 기본값)
   - **Install Command**: `pnpm install`

2. **Settings → Environment Variables**
   ```
   VITE_API_URL=https://riy8obritg.execute-api.ap-northeast-2.amazonaws.com/prod
   VITE_ENV=production
   ```

### 2. Vercel CLI 배포

```bash
# Vercel 로그인
npx vercel login

# 프로젝트 연결
npx vercel link --project <project-name>

# 환경변수 설정
echo "https://riy8obritg.execute-api.ap-northeast-2.amazonaws.com/prod" | npx vercel env add VITE_API_URL production
echo "production" | npx vercel env add VITE_ENV production

# Production 배포
npx vercel --prod
```

### 3. SPA 라우팅 설정

`apps/web/vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

---

## AWS SAM 배포 (Backend)

### 1. GitHub Actions 자동 배포

`main` 브랜치에 push하면 자동으로 배포됩니다.

트리거 조건:

- `services/api/**` 변경
- `packages/core/**` 변경
- `.github/workflows/deploy.yml` 변경

### 2. 수동 배포

```bash
cd services/api

# 빌드
sam build

# Dev 환경 배포
sam deploy \
  --stack-name invest-assist-api-dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-confirm-changeset \
  --resolve-s3 \
  --parameter-overrides \
    Environment=dev \
    JwtSecretArn=<JWT_SECRET_ARN> \
    SesFromEmail=<SES_EMAIL> \
    AppUrl=https://invest-project-orpin.vercel.app

# Prod 환경 배포
sam deploy \
  --stack-name invest-assist-api-prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-confirm-changeset \
  --resolve-s3 \
  --parameter-overrides \
    Environment=prod \
    JwtSecretArn=<JWT_SECRET_ARN> \
    SesFromEmail=<SES_EMAIL> \
    AppUrl=https://invest-project-orpin.vercel.app
```

### 3. GitHub Secrets 설정

```
AWS_ROLE_ARN=<AWS IAM Role ARN for OIDC>
JWT_SECRET_ARN=<Secrets Manager ARN>
SES_FROM_EMAIL=<Verified SES Email>
APP_URL=https://invest-project-orpin.vercel.app
```

---

## CORS 설정

### 허용된 Origins

`services/api/src/shared/response.ts`:

```typescript
const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://invest-project-orpin.vercel.app'];
```

### URL 변경 시 수정 필요한 파일

1. `services/api/src/shared/response.ts` - ALLOWED_ORIGINS
2. `services/api/template.yaml` - API Gateway CORS 설정
3. `services/api/src/modules/auth/handlers/refresh.ts` - ALLOWED_ORIGINS
4. `services/api/src/modules/auth/handlers/logout.ts` - ALLOWED_ORIGINS

---

## API Endpoints

- **Prod**: `https://riy8obritg.execute-api.ap-northeast-2.amazonaws.com/prod`
- **Dev**: `https://vtvvcyx2m3.execute-api.ap-northeast-2.amazonaws.com/dev` (미사용)

---

## 트러블슈팅

### 404 에러 (Vercel)

1. Vercel 대시보드에서 **Root Directory**가 `apps/web`으로 설정되어 있는지 확인
2. `apps/web/vercel.json`에 rewrites 설정이 있는지 확인
3. 재배포: `npx vercel --prod`

### CORS 에러

1. API 코드에서 프론트엔드 URL이 ALLOWED_ORIGINS에 포함되어 있는지 확인
2. `template.yaml`의 API Gateway CORS 설정 확인
3. API 재배포 (GitHub Actions 또는 수동)

### 환경변수 확인

```bash
# Vercel 환경변수 확인
npx vercel env ls

# 환경변수 다운로드
npx vercel env pull
```
