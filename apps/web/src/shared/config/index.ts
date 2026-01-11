export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE || 'ko-KR',
} as const;
