---
module: pages/stack/object-scanner
summary: Детекция объектов моделью object_detector — камера в BottomSheet, список найденного.
---

# object-scanner

Пример детекции объектов моделью `object_detector` (кладётся в те же папки моделей, что
и модели сканеров; классы и имена — из метаданных модели). Экран `ObjectScanner`
корневого стека, группа `Private`, без общей шапки (`NO_HEADER`, свой `Navbar` с именем
маршрута); параметров нет. Deep link — `objectscanner`. Открывается с вкладки Playground.

## Public API

| Экспорт         | Что                           |
| --------------- | ----------------------------- |
| `ObjectScanner` | Компонент экрана (`observer`) |

## Устройство

- VM — `useObjectScanVM()` из фичи; камера — `ObjectScanCamera` (`vm.camera`) в
  `BottomSheet` (`isActive` только пока лист открыт). «Найти объекты» вызывает
  `vm.clearDetections()` и открывает лист; «Готово» закрывает его.
- `vm.detections` (метка + score) обновляются на лету: в листе — строкой под камерой, на
  странице — карточкой с процентами; после закрытия листа последний список остаётся.
- Разрешение камеры и инференс — внутри фичи.

## Зависимости

- `@features/object-scan` — `useObjectScanVM`, `ObjectScanCamera`.
- `@shared/lib/navigation` (`useRoute`), `@shared/ui`.
