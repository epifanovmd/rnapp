---
module: pages/stack/web-view
summary: Модальный встроенный браузер по URL с полосой прогресса загрузки.
---

# web-view

Модальный экран со встроенным браузером. Экран `WebView` корневого стека, группа
`Private`, `MODAL_OPTIONS` (модальная анимация iOS, жест закрытия выключен, без общей
шапки). Deep link — `webview`.

Параметры (`TWebViewParams`): `url` — обязательный, `title?` — заголовок навбара.

## Public API

| Экспорт          | Что                     |
| ---------------- | ----------------------- |
| `WebView`        | Компонент экрана        |
| `TWebViewParams` | Тип параметров маршрута |

## Устройство

- Свой `Navbar` с кнопкой «назад», под ним полоса прогресса (Reanimated shared value
  `percentage` из `onLoadProgress`, прячется на 100 %), страница — `react-native-webview`
  с жестами «назад/вперёд» (`allowsBackForwardNavigationGestures`).
- Пока страница грузится — `Spinner` с тем же прогрессом (`renderLoading`).

## Зависимости

- `@shared/ui` (`Container`, `Navbar`, `Spinner`), `@shared/lib/navigation`
  (`ScreenProps`).
- `react-native-webview`, `react-native-reanimated`, `react-native-safe-area-context`.

## Gotcha

- Компонент экрана называется `WebView` и совпадает с компонентом библиотеки — внутри он
  импортируется как `RNWebView`.
- Состояния ошибки загрузки нет (в отличие от `pdf-view`).
