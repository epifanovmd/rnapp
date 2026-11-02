<!-- Ведётся вручную: правило — docs/00-meta/authoring.md#индекс. -->

# Документация проекта

Единая система знаний: как она устроена — [meta/doc-system](00-meta/doc-system.md),
как добавить документ — [meta/authoring](00-meta/authoring.md). Документы модулей —
[modules.md](modules.md). Номер папки — приоритет при конфликте.

## Документы

### 00-meta

| Документ                                 | О чём                                                                                                               | Слой | Роли | Этапы |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---- | ---- | ----- |
| [meta/authoring](00-meta/authoring.md)   | Куда класть новое знание, формат frontmatter, размеры, ссылки и индекс документов.                                  | core | all  | docs  |
| [meta/doc-system](00-meta/doc-system.md) | Уровни L0–L5, что где лежит и когда попадает в контекст агента.                                                     | core | all  | any   |
| [meta/priority](00-meta/priority.md)     | Порядок старшинства источников правил, слои core/stack/project, что делать при противоречии.                        | core | all  | any   |
| [meta/protection](00-meta/protection.md) | Правила и документация меняются только по явному указанию пользователя; новое правило агент предлагает через inbox. | core | all  | any   |

### 10-process

| Документ                                           | О чём                                                                                                              | Слой | Роли                        | Этапы                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---- | --------------------------- | ------------------------------------------------ |
| [process/bugfix](10-process/bugfix.md)             | Багфикс через тест — воспроизвести падающим тестом, найти причину, исправить, тест остаётся.                       | core | developer, tester           | analysis, planning, implementation, verification |
| [process/git](10-process/git.md)                   | Ветки на задачу, Conventional Commits на русском, что запрещено без команды пользователя.                          | core | all                         | commit                                           |
| [process/review](10-process/review.md)             | Чек-лист ревью diff по архитектуре, конвенциям, тестам и документации; когда звать субагента reviewer.             | core | reviewer, developer         | review                                           |
| [process/roles](10-process/roles.md)               | Роли в разработке, их документы и субагенты — архитектор, разработчик, тестировщик, ревьюер, devops, документатор. | core | all                         | any                                              |
| [process/verification](10-process/verification.md) | Быстрые проверки после итерации, полная проверка перед сдачей, критерии готовности задачи.                         | core | developer, tester, reviewer | implementation, verification                     |
| [process/workflow](10-process/workflow.md)         | Обязательный цикл любой задачи — приём, анализ, план (gate), итерации, проверка, ревью, документация, коммит.      | core | all                         | any                                              |

### 20-architecture

| Документ                                                                               | О чём                                                                                                                                                  | Слой    | Роли                           | Этапы                                      |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------------------------------ | ------------------------------------------ |
| [architecture/adr/0001-knowledge-system](20-architecture/adr/0001-knowledge-system.md) | Документация, правила и процедуры — в одной системе уровней L0–L5 с ленивой загрузкой, защитой по явному указанию и inbox.                             | core    | architect                      | analysis                                   |
| [architecture/adr/0002-app-in-repo-root](20-architecture/adr/0002-app-in-repo-root.md) | Шаблон template/ для react-native init упразднён — приложение, его конфиги и система знаний лежат в корне.                                             | project | architect, devops              | analysis                                   |
| [architecture/adr/README](20-architecture/adr/README.md)                               | Журнал архитектурных решений — зачем, когда писать ADR, список решений.                                                                                | core    | architect                      | analysis, planning                         |
| [architecture/automated-checks](20-architecture/automated-checks.md)                   | Какие архитектурные правила проверяются машиной и как оформляется узкое исключение из правила.                                                         | stack   | architect, reviewer, devops    | verification, review                       |
| [architecture/dependencies](20-architecture/dependencies.md)                           | Импорты только вниз, слайсы одного слоя изолированы, self-import запрещён, общее — вниз или через контракт.                                            | stack   | all                            | analysis, planning, implementation, review |
| [architecture/di](20-architecture/di.md)                                               | Явная сборка контейнера из модулей слайсов, токен вместе с интерфейсом, без обёрточных хуков, DI только на реальных границах.                          | stack   | developer, architect           | planning, implementation                   |
| [architecture/errors](20-architecture/errors.md)                                       | Result-контракт вместо исключений, нормализованные ошибки транспорта, одна ошибка — одно уведомление, место providers уведомлений.                     | stack   | developer, architect           | planning, implementation                   |
| [architecture/fsd-layers](20-architecture/fsd-layers.md)                               | Шесть слоёв Feature-Sliced Design, их ответственность, слайсы и сегменты, именование сегментов.                                                        | stack   | all                            | analysis, planning                         |
| [architecture/http-session](20-architecture/http-session.md)                           | Цепочка хранилище токенов → сессия → HTTP-клиент → API → сокет; обязательные свойства обновления токена и переподключения.                             | stack   | developer, architect           | planning, implementation                   |
| [architecture/native](20-architecture/native.md)                                       | Нативный модуль за единым JS-контрактом, codegen-спеки по правилам платформы, платформенные файлы, документирование ассетов рядом с ними.              | stack   | developer, architect           | planning, implementation                   |
| [architecture/navigation](20-architecture/navigation.md)                               | Конфигурация навигаторов в app, инфраструктура в shared, guard-группы по авторизации, параметры экрана рядом с ним, бутстрап на готовности навигатора. | stack   | developer, architect           | planning, implementation                   |
| [architecture/placement](20-architecture/placement.md)                                 | Дерево решений — слой и сегмент для компонента, логики, API-вызова, provider; feature против widget; что такое page.                                   | stack   | developer, architect           | analysis, planning                         |
| [architecture/public-api](20-architecture/public-api.md)                               | Один index.ts на слайс, в shared — на каждый модуль; экспортируется только поддерживаемое.                                                             | stack   | developer, architect, reviewer | implementation, review                     |
| [architecture/state](20-architecture/state.md)                                         | Сторы — синхронное состояние домена через DI; асинхронное состояние — только холдеры с общими гарантиями.                                              | stack   | developer, architect           | planning, implementation                   |

### 30-conventions

| Документ                                                         | О чём                                                                                                                                              | Слой  | Роли                        | Этапы                                |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------------------------- | ------------------------------------ |
| [conventions/checklist](30-conventions/checklist.md)             | Пункты ревью, специфичные для стека React Native + MobX + FSD, — дополняют общий чек-лист process/review.                                          | stack | reviewer, developer         | review                               |
| [conventions/comments](30-conventions/comments.md)               | Комментарий объясняет причину — JSDoc к контрактам, в теле только неочевидное, без истории изменений и мёртвого кода.                              | core  | developer, reviewer         | implementation, review               |
| [conventions/components](30-conventions/components.md)           | Один компонент на файл, helper-компоненты рядом, memo по измеримой причине, displayName у forwardRef.                                              | stack | developer, reviewer         | implementation, review               |
| [conventions/errors](30-conventions/errors.md)                   | Ошибки не глотаются, сообщение отделено от технической ошибки, обработка на одном уровне, result-контракт не смешивается с исключениями.           | stack | developer, reviewer         | implementation, review               |
| [conventions/exports-imports](30-conventions/exports-imports.md) | Оформление index.ts, aliases снаружи и относительные пути внутри, import type, сортировка, без циклов через barrel.                                | stack | developer, reviewer         | implementation, review               |
| [conventions/forms](30-conventions/forms.md)                     | Декларативные формы — схема валидации отдельно, общие валидации домена в сущности, сообщения в UI-слое.                                            | stack | developer, reviewer         | implementation, review               |
| [conventions/functions](30-conventions/functions.md)             | Только стрелочные функции, хелпер выше использования, дженерик <T,> в tsx, одна операция на функцию, options вместо boolean-флагов.                | stack | developer, reviewer         | implementation, review               |
| [conventions/hooks](30-conventions/hooks.md)                     | Правила хуков, честные dependency arrays без механических правок, latest-ref для свежих значений, без новых suppressions.                          | stack | developer, reviewer         | implementation, review               |
| [conventions/lint](30-conventions/lint.md)                       | Область действия правил, что не редактируется вручную, правила отключения линтера, autofix и форматирование.                                       | stack | developer, reviewer         | implementation, review               |
| [conventions/naming](30-conventions/naming.md)                   | kebab-case директорий, таблица имён файлов (компоненты, хуки, store, validation, module, contract), запрещённые сегменты.                          | stack | developer, reviewer         | implementation, review               |
| [conventions/state-effects](30-conventions/state-effects.md)     | Владелец lifecycle у каждого эффекта, очистка подписок, отмена устаревших запросов, навигация вне features.                                        | stack | developer, reviewer         | implementation, review               |
| [conventions/styles](30-conventions/styles.md)                   | UI-кит и тема вместо литералов, статические стили заранее, динамика отдельным элементом массива, платформенные файлы только при реальном различии. | stack | developer, reviewer         | implementation, review               |
| [conventions/tests](30-conventions/tests.md)                     | Тесты поведения рядом с кодом в **tests**, регрессионный тест на баг, без зависимости от порядка, зоны с порогом покрытия.                         | stack | developer, tester, reviewer | implementation, verification, review |
| [conventions/typescript](30-conventions/typescript.md)           | Без any и небезопасных assertion, типы рядом с владельцем, без shared/types, DTO у API, явный export type.                                         | stack | developer, reviewer         | implementation, review               |

### 40-principles

| Документ                                                     | О чём                                                                                                                              | Слой | Роли                           | Этапы                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------ | -------------------------------- |
| [principles/clean-code](40-principles/clean-code.md)         | Приоритеты хорошего кода, порядок работы, KISS, YAGNI, DRY по знанию, сигналы к рефакторингу.                                      | core | developer, reviewer, architect | planning, implementation, review |
| [principles/solid-patterns](40-principles/solid-patterns.md) | Паттерн только под сформулированную проблему; SOLID без избыточной архитектуры; композиция вместо наследования; таблица паттернов. | core | architect, developer, reviewer | planning, implementation, review |

### 50-tech

| Документ                                         | О чём                                                                                                                                  | Слой    | Роли              | Этапы                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------- | ---------------------------- |
| [tech/aliases](50-tech/aliases.md)               | Шесть алиасов слоёв FSD, где объявлены (tsconfig и babel — синхронно), частые публичные пути shared.                                   | project | developer         | implementation               |
| [tech/gotchas](50-tech/gotchas.md)               | Неочевидное поведение, не привязанное к одному модулю — Yarn, worklets, даты, сборка iOS после pod install.                            | project | developer         | implementation, verification |
| [tech/native-modules](50-tech/native-modules.md) | WheelPicker, AppSplash, VisionEngine (Nitro, OCR и детекция для VisionCamera) — где лежат, как генерируются, gotcha сборки и worklets. | project | developer         | implementation               |
| [tech/recipes](50-tech/recipes.md)               | Эталоны в коде — entity-стор, feature с VM-хуком и формой, экран и его регистрация, compound на слотах, стили темы, сценарии действий. | project | developer         | implementation               |
| [tech/testing](50-tech/testing.md)               | Jest без RN-рантайма, стабы нативных модулей, порог 100% на холдеры, как тестировать хуки и VM без react-dom.                          | project | developer, tester | implementation, verification |

### 60-domain

| Документ                                 | О чём                                                                                                                               | Слой    | Роли                 | Этапы              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------- | ------------------ |
| [domain/glossary](60-domain/glossary.md) | Термины проекта — сессия, 2FA, биометрия, guard-группа, комната, холдер, VM, панель, телеметрия скролла, конвейер кадра.            | project | all                  | any                |
| [domain/overview](60-domain/overview.md) | Что за приложение, разделы, бэкенд и стек React Native.                                                                             | project | all                  | intake, analysis   |
| [domain/screens](60-domain/screens.md)   | Корневой стек с guard-группами, вкладки, экраны стека и их слайсы, бутстрап, deep linking, обновление данных после переподключения. | project | developer, architect | analysis, planning |

### 70-ops

| Документ                                 | О чём                                                                                                             | Слой    | Роли              | Этапы                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------- | ----------------- | ---------------------------- |
| [ops/build](70-ops/build.md)             | Проверка нативной сборки, конфигурация Podfile и Gradle, предсобранные бинарники, orval, Babel и Metro.           | project | devops, developer | implementation, verification |
| [ops/commands](70-ops/commands.md)       | Быстрая и полная проверка, тест одного файла, форматирование, запуск на платформах, генерация, документация.      | project | all               | implementation, verification |
| [ops/environment](70-ops/environment.md) | Требования, соседние репозитории, multi-env через react-native-config — файлы, переменные, как попадают в сборку. | project | developer, devops | implementation               |
| [ops/git-hooks](70-ops/git-hooks.md)     | lefthook — pre-commit (lint, формат, типы, тесты с покрытием).                                                    | project | devops, developer | commit                       |

### inbox

| Документ                        | О чём                                                                                         | Слой | Роли | Этапы |
| ------------------------------- | --------------------------------------------------------------------------------------------- | ---- | ---- | ----- |
| [inbox/README](inbox/README.md) | Очередь предложений новых правил и правок защищённых документов, ждущих решения пользователя. | core | all  | docs  |

Открытые предложения правил — файлы [inbox/](inbox/README.md), кроме README.
