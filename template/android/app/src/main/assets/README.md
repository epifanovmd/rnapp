# assets

TFLite-модели детекторов регионов для OCR-сканера (модуль
`react-native-ocr-engine`). Всё содержимое папки попадает в APK;
модуль загружает модель из assets по имени.

Модели кладутся сюда вручную. Ожидаемый формат — YOLO-детектор,
экспортированный в TFLite (ultralytics: `model.export(format="tflite")`,
fp16 либо int8).

| Файл | Кто использует |
|---|---|
| `container_code_detector.tflite` | сканер кодов контейнеров (`features/container-scan`) |
| `plate_detector.tflite` | сканер автономеров (`features/plate-scan`) |

Имя файла должно совпадать с `detectorModelName` домена. Модель опциональна:
без неё сканер работает в полнокадровом режиме. После добавления или замены
модели требуется пересборка приложения.
