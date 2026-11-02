---
id: conventions/state-effects
title: Состояние и side effects
summary: Владелец lifecycle у каждого эффекта, очистка подписок, отмена устаревших запросов, навигация вне features.
layer: stack
roles: [developer, reviewer]
stages: [implementation, review]
depends_on: [architecture/state]
---

# Состояние и side effects

- Store хранит состояние и переходы, а не разметку.
- API и platform adapters — вне UI-компонента.
- Асинхронное состояние — в холдерах, а не в паре «локальный state + эффект-загрузка».
- Side effect запускается на уровне, который владеет его жизненным циклом.
- Глобальная инициализация, providers и composition — в `app`; глобальный provider
  монтируется в composition root.
- Feature не выполняет навигацию, если результат сценария можно вернуть
  callback/result и обработать в page/app.
- Подписки, таймеры и listeners обязательно освобождаются; subscription возвращает
  cleanup.
- Асинхронный код учитывает отмену или устаревший результат, если это влияет на UI.
- HTTP/socket/storage скрыты за понятным API; utility, обещающая вычисление, не
  делает I/O.
- Повторная инициализация безопасна либо запрещена контрактом.
