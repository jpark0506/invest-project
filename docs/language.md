# language.md — Internationalization (i18n) Requirements

## Internationalization (i18n) Requirements

- The product MUST support multiple languages (i18n) from the beginning.
- The first production implementation MUST ship in Korean (ko-KR) and all UX copy defaults to Korean.
- The system MUST be designed so that English (en-US) and additional locales can be added without refactoring core UI/business logic.
- All user-facing strings must be managed via a localization layer (no hard-coded copy in components).
