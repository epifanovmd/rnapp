---
module: features/plate-scan
summary: Сканер российских автономеров — OCR-домен с детектором номера и подтверждением серией сканов.
---

# plate-scan

Распознаёт автономер, разбирает его на части и отдаёт результат один раз до сброса. Камера и
пайплайн — общий `OcrScanCamera`.

## Public API

| Экспорт                                                  | Что                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `usePlateScanVM`, `IPlateScanVM`, `IUsePlateScanVMProps` | разрешение камеры, фонарик, `result`, `restartScan`; колбэк `onRecognized` |
| `PlateScanCamera`, `IPlateScanCameraProps`               | камера: `vm`, `isActive`, `style`                                          |
| `IPlateScanResult`                                       | `value` латиницей, `formatted` кириллицей, `parts`, `confidence`           |
| `PLATE_SCAN_DOMAIN`                                      | OCR-домен для `OcrScanCamera`                                              |

## Устройство

- `model/plate-scan-domain.ts` — кандидаты по каждому региону детектора `plate_detector`
  (одноклассовая модель), без детектора — по полному кадру; `confirmStreak: 4` — у номера нет
  контрольной цифры.
- `model/usePlateScanVM.ts` — `parsePlate` → хаптик, `setResult`, `onRecognized`. Сканер камеры
  по ссылке (`attachScanner`), `restartScan` сбрасывает результат и делает `resume()`.
- `PlateScanCamera` активна только при `isActive && result === null`.

## Зависимости

- `@shared/lib/plate-ocr`, `@shared/lib/ocr-scan`, `@shared/ui` (`OcrScanCamera`),
  `react-native-vision-camera`, `react-native-haptic-feedback`.
- Используется: `pages/stack/plate-scanner`.
