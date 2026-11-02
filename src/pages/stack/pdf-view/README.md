---
module: pages/stack/pdf-view
summary: Модальный просмотр PDF по URL с полосой прогресса и повтором при ошибке.
---

# pdf-view

Модальный экран просмотра PDF-документа по ссылке. Экран `PdfView` корневого стека,
группа `Private`, `MODAL_OPTIONS` (модальная анимация iOS, жест закрытия выключен, без
общей шапки). Deep link — `pdfview`.

Параметры (`TPdfViewParams`): `url` — обязательный, `title?` — заголовок навбара.

## Public API

| Экспорт          | Что                     |
| ---------------- | ----------------------- |
| `PdfView`        | Компонент экрана        |
| `TPdfViewParams` | Тип параметров маршрута |

## Устройство

- Свой `Navbar` с кнопкой «назад», под ним полоса прогресса (Reanimated shared value
  `percentage`, прячется на 100 %), документ — `react-native-pdf`.
- Ошибка загрузки — `EmptyState` с «Повторить»: состояние `failed` хранит URL с ошибкой и
  номер попытки; попытка — `key` у `Pdf`, смена ключа перемонтирует просмотрщик.
- Ошибка привязана к URL: при новом `url` экран снова пробует загрузить документ.

## Зависимости

- `@shared/ui` (`Container`, `Navbar`, `EmptyState`, `Button`),
  `@shared/lib/navigation` (`ScreenProps`).
- `react-native-pdf`, `react-native-reanimated`, `react-native-safe-area-context`.
