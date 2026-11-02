---
id: tech/gotchas
title: Сквозные gotcha
summary: Неочевидное поведение, не привязанное к одному модулю — Yarn, worklets, даты, сборка iOS после pod install.
layer: project
roles: [developer]
stages: [implementation, verification]
depends_on: []
---

# Сквозные gotcha

Gotcha одного модуля — в его README. Здесь — только сквозные.

- Потоки worklets — только `scheduleOnUI` / `scheduleOnRN` из `react-native-worklets`;
  `runOnUI` / `runOnJS` из Reanimated устарели. `.runOnJS(true)` у жестов RNGH — другое
  API, остаётся.
- Даты — только `date-fns`; локаль по умолчанию задаёт `setDefaultOptions({ locale: ru })`
  в `App.tsx`.
- Пакет `@epifanovmd/anchor-list` подключён локально (`link:../anchor-list`): репозиторий
  должен лежать рядом; Metro следит за ним через `watchFolders`.
- iOS после `pod install`: ядро RN подключается готовым `React-Core-prebuilt`, вариант под
  конфигурацию подставляет фаза сборки по маркеру
  `Pods/React-Core-prebuilt/.last_build_configuration`. `pod install` стирает маркер —
  если остался release-вариант, Debug-линковка падает с `Undefined symbols` в
  `facebook::react::Sealable`. Починка — в `ios/Pods`, затем пересборка:

  ```sh
  printf Release > React-Core-prebuilt/.last_build_configuration
  node ../../node_modules/react-native/scripts/replace-rncore-version.js -c Debug -r <версия RN> -p "$PWD"
  ```
