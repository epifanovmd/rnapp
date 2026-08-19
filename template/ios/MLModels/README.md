# MLModels

CoreML-модели детекторов регионов для OCR-сканера (модуль
`react-native-vision-engine`). Папка подключена к Xcode-проекту как
synchronized group: всё, что лежит здесь, попадает в бандл, а `.mlpackage`
при сборке компилируется в `.mlmodelc`.

Модели кладутся сюда вручную. Ожидаемый формат — YOLO-детектор,
экспортированный в CoreML со встроенным NMS (ultralytics:
`model.export(format="coreml", nms=True)`).

| Файл                                | Кто использует                                       |
| ----------------------------------- | ---------------------------------------------------- |
| `container_code_detector.mlpackage` | сканер кодов контейнеров (`features/container-scan`) |
| `plate_detector.mlpackage`          | сканер автономеров (`features/plate-scan`)           |
| `object_detector.mlpackage`         | пример детекции объектов (`features/object-scan`)    |

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
