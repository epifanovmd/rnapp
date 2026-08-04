# CLAUDE.md

## Язык ответа

Отвечать на русском.

## Проект

RN template app (messenger demo): auth (sign-in/up/recovery, 2FA, biometrics, passkeys), чат
(мок-данные), settings, ui-kit-demo. Код — в `template/` (корневые `package.json`/`template.config.js`
принадлежат scaffold-утилите, не приложению).

## Стек

RN 0.86 + React 19.2 + TS 5.9 + MobX 6 + React Navigation 7 + Socket.IO 4 + Axios + Zod 4 +
react-hook-form 7 + Inversify 8 + Skia + Reanimated + `@legendapp/list` v3.3 + keyboard-controller.
New Architecture (Fabric/TurboModules). Node >= 22.11.

## Layout (FSD: app → pages → widgets → features → entities → shared)

- `app/` — композиционный корень: App.tsx, App.navigator.tsx, App.screens.ts, app-tab-screens.tsx,
  App.linking.ts, App.notifications.tsx, app.module.ts (DI), app-data-* (стор данных приложения)
- `pages/` — sign-in, sign-up, recovery-password, chat, settings, ui-kit-demo
- `widgets/` — chat-room, app-shell
- `features/` — sign-in, sign-up, recovery-password, biometric
- `entities/` — auth, user
- `shared/` — ui | api | config | lib (di, holders, navigation, theme, socket, keyboard, ...)

## Правила (обязательные)

- FSD: импорт только вниз по слоям; слайсы одного слоя не импортируют друг друга
  (`eslint-plugin-boundaries`). Именование файлов/папок — `eslint-plugin-check-file`.
- `shared/api/gen/` — orval-генерация, **не редактировать** (`npm run generate:orval`).
- Алиасы `@app/@pages/@widgets/@features/@entities/@shared` — в `tsconfig.json` **и**
  `babel.config.js`, синхронно.
- Внутри слайса/сегмента — только относительные импорты; self-alias запрещён (`no-restricted-imports`).
- После каждой задачи — прогон `tsc --noEmit` и `eslint` в `template/`. Все ошибки править сразу, за один проход.

## Комментарии в коде

- Разрешены только: JSDoc/краткий комментарий к пропсам, определениям функций, компонентов и хуков.
- В теле функций — только если место неочевидное и без комментария нельзя.
- Комментарий — краткий, по факту. Не описывать историю изменений.
- Если комментарий устарел — переписать заново, а не дополнять.

## Делегирование Codex

Плагин `codex@openai-codex`. Разделение ролей жёсткое:

- **Codex — read-only.** Разведка, чтение, анализ, критика. Ничего не пишет на диск.
- **Claude — все записи.** Edit/Write/Bash-правки, git, решения по архитектуре — только сам.

Канал вызова один: `Agent(subagent_type: "codex:codex-rescue")`, инлайн (не из форка — там нет
`Agent`). Команды `/codex:review` и `/codex:adversarial-review` вызывает только пользователь;
самому их не вызывать, review-задачи слать через тот же сабагент.

### Что делегировать

1. **Погружение в контекст.** Разведка по незнакомой части кода, карта фичи, трассировка потока
   данных, поиск всех мест использования, ответ на «где и как это устроено».
2. **Поиск по коду.** Задачи вида «найди все X», «какие слайсы зависят от Y», «есть ли уже
   реализация Z» — когда область поиска шире, чем один-два прицельных `Grep`.
3. **Веб-исследование.** Разбор внешних библиотек, changelog'и, breaking changes, RN/iOS/Android
   API. В `~/.codex/config.toml` включён `tools.web_search`.
4. **Совет по тяжёлым задачам.** Перед реализацией нетривиального решения — запросить разбор
   вариантов и подводных камней.
5. **Критика.** Когда решение спорное или затрагивает архитектуру — отдельным прогоном спросить,
   где подход развалится. Просить оспаривать, а не соглашаться.
6. **Проверка после задачи.** По завершении работы над кодом — прогон Codex по итоговому диффу:
   логика, регрессии, нарушения FSD-границ, забытые edge-кейсы.

### Как формулировать запрос

- **Явно писать «read-only, do not edit any files»** в каждом запросе. Сабагент по умолчанию
  добавляет `--write`; без этой фразы Codex получит право записи.
- Просить **краткий ответ по существу**: выводы + `file:line`, без пересказа кода и без дампов.
- Давать конкретный вопрос и границы поиска, а не тему. Плохо: «посмотри чат». Хорошо: «как
  `JsChatView` синхронизирует скролл при добавлении сообщения — какие механизмы `@legendapp/list`
  задействованы, файлы и строки».
- Указывать, что уже проверено — чтобы не тратил проход на то же самое.
- Длинная или открытая разведка — `--background`, свою работу продолжать параллельно, забрать
  результат позже.

### Границы

Не делегировать то, что быстрее сделать самому: чтение известного файла, прицельный `Grep` по
точной строке, вопросы по структуре FSD (описана здесь и в `ARCHITECTURE.md`). Каждый вызов —
отдельный прогон Codex со своей латентностью и стоимостью.

Результат Codex — вход для решения, а не само решение. Факты (пути, строки, API) проверять перед
тем, как на них опираться. После своих правок — `tsc --noEmit` и `eslint` в `template/`, как обычно.

## Документация

- Обновлять только если изменился архитектурный факт.
- Писать новое состояние, не описывать «что и когда изменилось».
- Только сухие факты: архитектура, структура, важные решения.

## Команды (из `template/`)

```bash
npm run ios:{Dev,Stg,Prod}-{Debug,Release}
npm run android:{Dev,Stg,Prod}-{Debug,Release}
npm run android:build          # assembleProductionRelease
npm run lint | lint:fix | prettier:fix
npm run generate:orval         # перегенерировать shared/api/gen/
npm run start | reinstall
```

Нет scaffolder'а — файлы создаются вручную.

## Нативные модули

ChatView/InputBar/ContextMenu — iOS-бриджи к поду `IOSChatView` (sibling repo
`../../../rn-chat-view`). Android/non-iOS — JS-порты (`JsChatView`/`JsInputBar`/`JsContextMenuView`).
Picker/WheelPicker — на обеих платформах.

`JsChatView` использует штатные механизмы `@legendapp/list` v3.3: `sharedValues`,
`stickyHeaderIndices`, `viewabilityConfigCallbackPairs`, `maintainVisibleContentPosition`,
`maintainScrollAtEnd`. Ручные JS-аналоги геометрии/якорей не допускаются.
Детали: `.claude/memory/project_native.md`.

## Где читать

- **Архитектура**: [`ARCHITECTURE.md`](ARCHITECTURE.md) — FSD, зависимости, naming, DI, state,
  HTTP/auth, socket, ESLint.
- Нативные модули / chat-view / keyboard: `.claude/memory/project_native.md`
- UI-кит: `.claude/memory/project_components.md`
- Экраны / навигация: `.claude/memory/project_screens.md`
- Паттерны: `.claude/memory/project_patterns.md`
- Сборка: `.claude/memory/project_build.md`
- Алиасы: `.claude/memory/project_aliases.md`
