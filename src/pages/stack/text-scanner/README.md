---
module: pages/stack/text-scanner
summary: Распознавание произвольного текста камерой — строки на лету в BottomSheet и на странице.
---

# text-scanner

Распознавание произвольного текста камерой. Экран `TextScanner` корневого стека, группа
`Private`, без общей шапки (`NO_HEADER`, свой `Navbar` с именем маршрута); параметров
нет. Deep link — `textscanner`. Открывается с вкладки Playground.

## Public API

| Экспорт       | Что                           |
| ------------- | ----------------------------- |
| `TextScanner` | Компонент экрана (`observer`) |

## Устройство

- VM — `useTextScanVM()` из фичи; камера — `TextScanCamera` (`vm.camera`) в
  `BottomSheet` (`isActive` только пока лист открыт). «Сканировать текст» вызывает
  `vm.clearLines()` и открывает лист; «Готово» закрывает его.
- Строки `vm.lines` обновляются на лету: в листе — одной строкой под камерой, на
  странице — карточкой; после закрытия листа последний результат остаётся.
- Разрешение камеры и распознавание — внутри фичи.

## Зависимости

- `@features/text-scan` — `useTextScanVM`, `TextScanCamera`.
- `@shared/lib/navigation` (`useRoute`), `@shared/ui`.
