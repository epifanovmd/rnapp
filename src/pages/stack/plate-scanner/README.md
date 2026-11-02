---
module: pages/stack/plate-scanner
summary: Сканер российских автономеров — камера в BottomSheet, номер с регионом на странице.
---

# plate-scanner

Сканер российских автомобильных номеров с проверкой формата ГОСТ. Экран `PlateScanner`
корневого стека, группа `Private`, без общей шапки (`NO_HEADER`, свой `Navbar` с именем
маршрута); параметров нет. Deep link — `platescanner`. Открывается с вкладки Playground.

## Public API

| Экспорт        | Что                           |
| -------------- | ----------------------------- |
| `PlateScanner` | Компонент экрана (`observer`) |

## Устройство

- VM — `usePlateScanVM({ onRecognized })` из фичи; камера — `PlateScanCamera` в
  `BottomSheet` (`isActive` только пока лист открыт). «Сканировать» вызывает
  `vm.restartScan()` и открывает лист; «Готово» закрывает его.
- При стабильном распознавании результат сохраняется в `useState`, лист закрывается.
  Карточка: номер (`formatted`), регион, уверенность OCR (`ResultRow` в том же файле).
- Разрешение камеры и распознавание — внутри фичи.

## Зависимости

- `@features/plate-scan` — `usePlateScanVM`, `PlateScanCamera`, `IPlateScanResult`.
- `@shared/lib/navigation` (`useRoute`), `@shared/ui`.
