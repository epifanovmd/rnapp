---
module: pages/stack/container-scanner
summary: Сканер кода морского контейнера (ISO 6346) — камера в BottomSheet и расшифровка результата.
---

# container-scanner

Сканер номера морского контейнера: камера распознаёт номер, типоразмер и табличку весов,
код проверяется контрольной цифрой ISO 6346. Экран `ContainerScanner` корневого стека,
группа `Private`, без общей шапки (`NO_HEADER`, свой `Navbar` с именем маршрута);
параметров нет. Deep link — `containerscanner`. Открывается с вкладки Playground.

## Public API

| Экспорт            | Что                           |
| ------------------ | ----------------------------- |
| `ContainerScanner` | Компонент экрана (`observer`) |

## Устройство

- VM — `useContainerScanVM({ onRecognized })` из фичи; камера — `ContainerScanCamera` в
  `BottomSheet` (`isActive` только пока лист открыт). «Сканировать» вызывает
  `vm.restartScan()` и открывает лист.
- Последний результат — локальный `useState`; карточка `ScanResultCard`
  (`components/`): разбор кода (владелец BIC, категория через `decodeEquipmentCategory`,
  серийный номер, контрольная цифра), типоразмер, веса и объём, уверенность OCR.
- Разрешение камеры и распознавание — внутри фичи.

## Зависимости

- `@features/container-scan` — `useContainerScanVM`, `ContainerScanCamera`,
  `IContainerScanResult`.
- `@shared/lib/container-ocr` (`decodeEquipmentCategory`), `@shared/lib/navigation`
  (`useRoute`), `@shared/ui`.

## Gotcha

- Лист при распознавании не закрывается: вызов `dismiss()` в `handleRecognized`
  закомментирован, хотя JSDoc экрана обещает закрытие; результат обновляется на странице
  под открытым листом.
