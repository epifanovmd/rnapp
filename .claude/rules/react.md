---
paths:
  - "src/**/*.tsx"
  - "src/**/use*.ts"
---

# React-код

- Один компонент на файл; helper-компонент — отдельным файлом рядом
  ([components](../../docs/30-conventions/components.md)).
- Только стрелочные функции, хелпер выше использования, дженерик `<T,>`
  ([functions](../../docs/30-conventions/functions.md)).
- Dependency arrays — по фактическим зависимостям, не механически; новых
  `exhaustive-deps` suppressions нет; свежие значения — latest-ref
  ([hooks](../../docs/30-conventions/hooks.md)).
- Сценарий — в VM-хуке `use<Name>VM`, компонент — отображение и wiring; DI —
  `IXxx.useInstance()` без обёрточных хуков ([recipes](../../docs/50-tech/recipes.md)).
- Подписки, таймеры, слушатели очищаются; права — через стор пользователя, по строке
  ([state-effects](../../docs/30-conventions/state-effects.md)).
- Стили — тема и UI-кит, статика заранее, динамика отдельным элементом массива; worklets —
  `scheduleOnUI`/`scheduleOnRN`, функции объявлены выше вызова
  ([styles](../../docs/30-conventions/styles.md)).
