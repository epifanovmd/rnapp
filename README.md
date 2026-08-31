# React Native Template

Шаблон React Native приложения с архитектурой Feature-Sliced Design:
`app → pages → widgets → features → entities → shared`.

Код приложения находится в `template/`; корневые `package.json` и `template.config.js`
принадлежат scaffold-утилите, а не приложению.

Документация:

- архитектурная модель, слои, границы, навигация и состояние — [ARCHITECTURE.md](template/ARCHITECTURE.md);
- памятка «что куда класть» — [FSD-CHEATSHEET.md](template/FSD-CHEATSHEET.md);
- правила написания кода — [CONVENTIONS.md](template/CONVENTIONS.md);
- принципы проектирования — [CLEAN-CODE.md](template/CLEAN-CODE.md) и
  [DESIGN-PRINCIPLES.md](template/DESIGN-PRINCIPLES.md).

Документация описывает общие принципы и не содержит описания конкретных экранов и
модулей. Она не изменяется без явного запроса.

### Stack

- TypeScript
- React Native (New Architecture: Fabric / TurboModules)
- React Navigation (static API)
- MobX (state management)
- Inversify (DI)
- Axios (HTTP) + orval (codegen)
- Socket.IO (real-time)
- react-hook-form + Zod

### Requirements

- Node.js >= 22.11

### Installation

```sh
$ npm install -g @react-native-community/cli
$ npx react-native init ProjectName --template <template-repository-url>
$ cd <ProjectName>
$ yarn clean:android # This step is required for android
```

### Run for Android

```sh
$ chmod 755 android/gradlew
$ yarn android:Dev-Debug
```

### Run for IOS

```sh
$ yarn ios:Dev-Debug
```

### Checks

Обязательный минимум перед merge — линтер, проверка типов и тесты.

Из корня репозитория:

```sh
$ make check
```

Или из `template/`:

```sh
$ yarn run check      # lint + typecheck + test
$ yarn lint:fix
$ yarn prettier:fix
```

Для Yarn 1 используется именно `yarn run check`: `yarn check` — встроенная команда Yarn.

### API codegen

HTTP-клиент и типы генерируются из OpenAPI-схемы и **не редактируются вручную**:

```sh
$ yarn generate:orval
```

### License

MIT

**Free Software, Good Work!**
