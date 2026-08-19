# assets

TFLite-модели детекторов регионов для OCR-сканера (модуль
`react-native-vision-engine`). Всё содержимое папки попадает в APK;
модуль загружает модель из assets по имени.

Модели кладутся сюда вручную. Ожидаемый формат — YOLO-детектор,
экспортированный в TFLite (ultralytics: `model.export(format="tflite")`,
fp16 либо int8).

| Файл                             | Кто использует                                       |
| -------------------------------- | ---------------------------------------------------- |
| `container_code_detector.tflite` | сканер кодов контейнеров (`features/container-scan`) |
| `plate_detector.tflite`          | сканер автономеров (`features/plate-scan`)           |
| `object_detector.tflite`         | пример детекции объектов (`features/object-scan`)    |

Имя файла должно совпадать с `detector.modelName` домена. Модель опциональна:
без неё сканер работает в полнокадровом режиме. После добавления или замены
модели требуется пересборка приложения.

Классы модели контейнеров (`container_code_detector`) — в порядке
`CONTAINER_REGION_CLASSES` домена `features/container-scan`:

| Индекс | Класс              | Что читается           |
| ------ | ------------------ | ---------------------- |
| 0      | `container_code`   | код ISO 6346           |
| 1      | `container_type`   | типоразмер (size-type) |
| 2      | `container_weight` | табличка весов         |

Порядок классов модели обязан совпадать с этими индексами — привязка идёт
по `classIndex`, а не по имени класса (у TFLite и CoreML-экспорта без NMS
меток в модели нет).
