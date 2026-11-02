---
id: conventions/checklist
title: Чек-лист стека для ревью
summary: Пункты ревью, специфичные для стека React Native + MobX + FSD, — дополняют общий чек-лист process/review.
layer: stack
roles: [reviewer, developer]
stages: [review]
depends_on: [process/review]
---

# Чек-лист стека для ревью

Дополняет общий чек-лист [process/review](../10-process/review.md).

**Архитектура** — [fsd-layers](../20-architecture/fsd-layers.md),
[dependencies](../20-architecture/dependencies.md), [state](../20-architecture/state.md),
[navigation](../20-architecture/navigation.md), [native](../20-architecture/native.md)

- [ ] Код на минимально подходящем слое FSD; нет импортов вверх и между соседними
      слайсами; внутри слайса — относительные пути; экран — `pages/<navigator>/<page>`.
- [ ] Асинхронное состояние — через холдеры; API — `{ data } | { error }`, ошибки не
      глотаются.
- [ ] DI — токен через `useInstance`/`getInstance`, без обёрточных хуков; новый модуль
      зарегистрирован в композиционном корне.
- [ ] Сгенерированный код (клиент API, генерат Nitro) не правлен вручную.
- [ ] Нативные изменения проверены сборкой обеих платформ.

**React Native** — [components](components.md), [hooks](hooks.md),
[styles](styles.md), [functions](functions.md)

- [ ] Один компонент на файл; сценарий — в VM-хуке.
- [ ] Dependency arrays не изменены механически; новых отключений `exhaustive-deps` нет.
- [ ] Стили — тема и UI-кит; статика заранее, динамика отдельным элементом массива.
- [ ] Worklets — `scheduleOnUI`/`scheduleOnRN`, функции объявлены выше вызова.
