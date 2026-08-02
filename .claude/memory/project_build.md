---
name: Build & Environment
description: Команды, multi-env, native build notes (неочевидное)
type: project
---

Команды — в CLAUDE.md (из `template/`). Неочевидное:
- **`IOSChatView` — path-pod из sibling repo** (`../../../rn-chat-view`, вне этого репо) — клона этого
  репо недостаточно для `pod install`.
- 6 схем iOS / 6 variants Android = dev|stg|prod × debug|release; env из `config/env/*.{ios,android}.env`.
- Тайпо в `ios:Stg-Release` (`'rnapp.stagingReleasse'`) — не трогать без проверки.
- Release подписывается checked-in `debug.keystore` (прод-keystore не настроен).
- `orval.config.ts` генерит `shared/api/gen/` с **удалённой** OpenAPI-спеки
  (`http://147.45.245.104:8181/api-docs/swagger.json`).
- TS: `moduleSuffixes: [".ios",".android",".native",""]`, decorators включены (Inversify).

Подробности — `template/package.json`, `ios/Podfile`, `android/app/build.gradle`, `orval.config.ts`.
