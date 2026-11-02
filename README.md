# rnapp

React Native приложение с архитектурой Feature-Sliced Design:
`app → pages → widgets → features → entities → shared`.

Документация:

- архитектурная модель, слои, границы, навигация и состояние — [ARCHITECTURE.md](ARCHITECTURE.md);
- памятка «что куда класть» — [FSD-CHEATSHEET.md](FSD-CHEATSHEET.md);
- правила написания кода — [CONVENTIONS.md](CONVENTIONS.md);
- принципы проектирования — [CLEAN-CODE.md](CLEAN-CODE.md) и
  [DESIGN-PRINCIPLES.md](DESIGN-PRINCIPLES.md).

Документация описывает общие принципы и не содержит описания конкретных экранов и
модулей. Она меняется только в исключительных случаях — когда меняется архитектура,
принцип или паттерн проекта.

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
$ git clone <repository-url> rnapp
$ cd rnapp
$ yarn                       # зависимости и git-хуки (lefthook)
$ cd ios && pod install && cd ..
```

Пакет `@epifanovmd/anchor-list` подключён локально (`link:../anchor-list`): репозиторий
`anchor-list` должен лежать рядом с `rnapp`.

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

Обязательный минимум перед merge — линтер, формат, проверка типов и тесты с порогом покрытия.

```sh
$ yarn run check      # lint + format:check + typecheck + test:coverage
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
