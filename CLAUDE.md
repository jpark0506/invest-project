# CLAUDE.md - AI Assistant Guidelines

이 문서는 AI 어시스턴트가 이 프로젝트에서 작업할 때 따라야 할 규칙과 체크리스트입니다.

## 프로젝트 구조

- `apps/web` - Vite + React 프론트엔드
- `services/api` - AWS SAM + Lambda API
- `packages/core` - 공유 비즈니스 로직

## 커밋 전 필수 체크리스트

### 1. 타입 체크 (TypeScript)

코드 변경 후 반드시 타입 체크를 수행해야 합니다:

```bash
# API 서비스
cd services/api && pnpm tsc --noEmit

# Web 앱
cd apps/web && pnpm tsc --noEmit

# Core 패키지
cd packages/core && pnpm tsc --noEmit
```

### 2. Lint 체크

```bash
pnpm lint
```

### 3. 테스트 실행

```bash
pnpm test
```

## 브랜치 및 커밋 워크플로우

1. **브랜치 생성**: `git checkout -b <type>/<description>`
   - 타입: `feat`, `fix`, `refactor`, `docs`, `chore`
2. **변경 사항 작업**
3. **타입 체크 실행** ⚠️ 필수
4. **커밋**: Conventional Commits 형식 사용
5. **main으로 머지**
6. **push**

## 자주 놓치는 실수들

### ❌ 타입 체크 없이 커밋

**문제**: 타입 에러가 있는 상태로 커밋하면 CI에서 실패합니다.

**해결**: 커밋 전 항상 `pnpm tsc --noEmit` 실행

### ❌ 미사용 변수/import 남겨두기

**문제**: TypeScript의 `noUnusedLocals` 옵션으로 인해 빌드 실패

**해결**: 리팩토링 후 사용하지 않는 변수/import 제거

### ❌ CORS 설정 누락

**문제**: API 응답에 CORS 헤더가 없으면 브라우저에서 차단됨

**해결**: 
- `response.ts`의 `createResponder(event)` 사용
- 수동 응답 작성 시 CORS 헤더 포함

## API 핸들러 작성 패턴

```typescript
import { createResponder } from '../../../shared/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { success, errors } = createResponder(event);

  try {
    // 비즈니스 로직
    return success({ data });
  } catch (error) {
    return errors.internal('Error message');
  }
};
```

## 배포

- `main` 브랜치에 push하면 GitHub Actions가 자동 배포
- `services/api/**` 변경 → API 배포
- `apps/web/**` 변경 → Vercel 자동 배포
