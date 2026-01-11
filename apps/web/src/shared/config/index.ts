export const config = {
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE || 'ko-KR',
} as const;
