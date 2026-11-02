---
id: tech/native-modules
title: Нативные модули проекта
summary: WheelPicker, AppSplash, VisionEngine (Nitro, OCR и детекция для VisionCamera) — где лежат, как генерируются, gotcha сборки и worklets.
layer: project
roles: [developer]
stages: [implementation]
depends_on: [architecture/native]
---

# Нативные модули проекта

## WheelPicker (`RNWheelPicker`)

Колесо выбора; один нативный view — одна колонка. Единый API — Fabric-спека
`shared/ui/picker/native/NativeWheelPickerSpec.ts` (`codegenConfig`: `RNAppSpec`,
`jsSrcsDir: "src"`; имя файла фиксировано RN — исключение в `eslint.naming.mjs`).

- iOS — `ios/Picker/`: Swift/UIKit, `UICollectionView` + свой flow layout
  (цилиндрическая развёртка), снап в `scrollViewWillEndDragging`.
- Android — Kotlin, `RecyclerView` + `LinearSnapHelper`; пакет регистрируется вручную
  в `MainApplication.kt`.
- Нативная сторона — legacy view manager через interop-слой New Architecture.

## AppSplash

Свой splash на обеих платформах; JS — `@shared/lib/splash` → `AppSplash.hide({ fade })`.

- Android — тема запуска `BootTheme`; до Android 12 картинка — `drawable/splash_compat.xml`,
  с 12 — системный SplashScreen API; поверх окна остаётся `AppSplashView` до `hide()`.
- iOS — `ios/AppSplash/`: `Splash.storyboard` повторно поверх RN-контента.
- Ассеты генерирует `yarn splash` из `splash.config.mjs` (`scripts/splash/`, sharp).

## VisionEngine

Локальный Nitro-модуль `modules/react-native-vision-engine` (link-зависимость):
on-device OCR и детекция объектов для VisionCamera v5. Предметной области не знает —
модели, классы и правила чтения задаёт JS. Устройство и API — README модуля.

- Спека `src/specs/VisionEngine.nitro.ts`, генерат закоммичен в `nitrogen/generated/`.
  Регенерация — `npm run specs` в модуле (nitrogen + `strip-struct-equality.cjs`), затем
  `pod install`.
- Модели кладутся вручную: `ios/MLModels/*.mlpackage`,
  `android/app/src/main/assets/*.tflite` (см. README в этих папках); без модели OCR
  полнокадровый.
- JS-конвейер кадра и домены — `shared/lib/ocr-scan`, `scan-overlay`, `container-ocr`,
  `plate-ocr`, `object-scan` (их README).
- JVM-тесты Kotlin-частей: `./gradlew :react-native-vision-engine:testDebugUnitTest` из
  `android/`.

## Gotcha

- Кодоген Nitro: без `strip-struct-equality.cjs` Swift 6.2 / Xcode 26 теряет коллекционные
  методы у `std::vector` в генерате («vector has no member 'map'»).
- Swift в модуле: `Range` перекрыт типом VisionCamera — писать `Swift.Range`.
- Сессия кадра действительна, пока жив `Frame`: `dispose()` сессии — до
  освобождения кадра.
- Worklet захватывает только функции, объявленные выше по модулю; вызов объявленной ниже
  падает в рантайме камеры «undefined is not a function». Module-scope RegExp в worklet не
  сериализуется — литералы внутри тел функций.
- Frame-output создаётся на каждый маунт камеры: переиспользование между сессиями роняет
  AVFoundation.
