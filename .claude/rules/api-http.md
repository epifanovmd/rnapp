---
paths:
  - "src/shared/api/**"
  - "src/shared/lib/http/**"
  - "src/shared/lib/session/**"
  - "src/shared/lib/socket/**"
  - "src/**/api/**"
  - "src/shared/lib/storage/**"
  - "src/shared/lib/network/**"
  - "src/entities/*/model/*realtime*"
  - "src/app/app-data-store.ts"
---

# API, HTTP, сессия, сокет

- Цепочка хранилище → сессия → HTTP → API → сокет и её обязательные свойства —
  [http-session](../../docs/20-architecture/http-session.md).
- `request()` не реджектится; 4xx экран показывает сам через `notifyApiError`,
  сеть/таймаут/5xx — глобально; молчаливый `if (res.error) return` — дефект.
- Новый бэкенд — четвёрка auth-API → сессия → клиент → API в `api.module.ts`
  ([shared/api](../../src/shared/api/README.md)).
- Тесты — без сети: транспорт подменяется.
