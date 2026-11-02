---
paths:
  - "ios/**/*.{swift,m,mm,h,plist,storyboard}"
  - "ios/Podfile"
  - "ios/**/*.{pbxproj,xcconfig,entitlements}"
  - "android/**/*.{kt,java,gradle,xml,properties}"
  - "modules/**/*.{ts,tsx,swift,kt,cpp,hpp,podspec,json}"
  - "src/**/native/**"
  - "src/shared/lib/{ocr-scan,object-scan,plate-ocr,container-ocr,scan-overlay}/**"
  - "src/features/*-scan/**"
---

# Нативный слой

- Нативный модуль — за единым JS-контрактом; codegen-спеки и платформенные имена — по
  правилам платформы ([architecture/native](../../docs/20-architecture/native.md)).
- Модули проекта, кодоген Nitro, модели детекторов, gotcha Swift и worklets —
  [tech/native-modules](../../docs/50-tech/native-modules.md).
- После нативных изменений — сборка обеих платформ, не только JS-проверки
  ([ops/build](../../docs/70-ops/build.md)).
- Worklets — `scheduleOnUI`/`scheduleOnRN`; функция объявлена выше вызова; RegExp —
  внутри тела ([tech/native-modules](../../docs/50-tech/native-modules.md#gotcha)).
- Нельзя протестировать юнит-тестом — вынести вычислимую часть в чистый модуль и назвать
  невозможность прямого теста явно.
