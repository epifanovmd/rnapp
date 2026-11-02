<!-- Ведётся вручную: правило — docs/00-meta/authoring.md#индекс. -->

# Модули

Документация модулей лежит рядом с кодом: `src/<модуль>/README.md`. Шаблон —
[module-readme](00-meta/templates/module-readme.md).

## app

| Модуль                      | О чём                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| [app](../src/app/README.md) | Композиционный корень — провайдеры, DI, навигаторы и экраны, deep linking, бутстрап и данные сессии. |

## entities

| Модуль                                                | О чём                                                                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [entities/audit](../src/entities/audit/README.md)     | Журнал действий текущего пользователя — лента по курсору сервера и живые события audit:created.                            |
| [entities/auth](../src/entities/auth/README.md)       | Аутентификация — статус входа, вход/регистрация/2FA/restore/выход, guard текущей сессии и общие валидации логина и пароля. |
| [entities/file](../src/entities/file/README.md)       | Файлы пользователя — список страницами («мои» или все), загрузка с прогрессом, удаление и realtime-события.                |
| [entities/message](../src/entities/message/README.md) | Сообщение переписки — модель, реестр видов содержимого и UI пузыря, цитаты и разделителя даты.                             |
| [entities/user](../src/entities/user/README.md)       | Текущий пользователь — профиль, роли и права, приватность, сессии и realtime-синхронизация по сокету.                      |

## features

| Модуль                                                                    | О чём                                                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [features/account-security](../src/features/account-security/README.md)   | Настройки безопасности аккаунта — email, username, пароль, 2FA и удаление аккаунта.                         |
| [features/biometric](../src/features/biometric/README.md)                 | Вход по Face ID / Touch ID / отпечатку — регистрация ключа устройства, вход подписью nonce, тумблер в меню. |
| [features/container-scan](../src/features/container-scan/README.md)       | Сканер кодов морских контейнеров ISO 6346 — OCR-домен с детектором областей, типоразмер и веса.             |
| [features/delete-file](../src/features/delete-file/README.md)             | Сценарий удаления файла — подтверждение, удаление в сторе и уведомление об ошибке.                          |
| [features/edit-profile](../src/features/edit-profile/README.md)           | Редактирование личных данных профиля в модальной шторке.                                                    |
| [features/file-upload](../src/features/file-upload/README.md)             | Загрузка в «Мои файлы» — шторка источников (галерея, камера, документы), очередь и прогресс.                |
| [features/message-actions](../src/features/message-actions/README.md)     | Контекстное меню сообщения — ответить, изменить, удалить.                                                   |
| [features/object-scan](../src/features/object-scan/README.md)             | Пример детекции объектов камерой — боксы на оверлее и живой список найденного.                              |
| [features/plate-scan](../src/features/plate-scan/README.md)               | Сканер российских автономеров — OCR-домен с детектором номера и подтверждением серией сканов.               |
| [features/profile-settings](../src/features/profile-settings/README.md)   | Аватар профиля (новое фото или одно из своих изображений) и настройки приватности.                          |
| [features/recovery-password](../src/features/recovery-password/README.md) | Запрос письма для сброса пароля и состояние «письмо отправлено».                                            |
| [features/sign-in](../src/features/sign-in/README.md)                     | Вход по логину и паролю, подтверждение вторым паролем (2FA) и переход к GitHub OAuth.                       |
| [features/sign-out](../src/features/sign-out/README.md)                   | Выход из аккаунта с подтверждением и выход на всех устройствах.                                             |
| [features/sign-up](../src/features/sign-up/README.md)                     | Регистрация по email или телефону с необязательными именем и фамилией.                                      |
| [features/text-scan](../src/features/text-scan/README.md)                 | Распознавание произвольного текста камерой — живой поток строк в порядке чтения.                            |

## pages

| Модуль                                                                          | О чём                                                                                                           |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [pages/stack/audit](../src/pages/stack/audit/README.md)                         | «Журнал действий» — события безопасности текущего пользователя с подгрузкой по курсору.                         |
| [pages/stack/chat](../src/pages/stack/chat/README.md)                           | Демо-переписка — моковые сообщения в памяти и ChatView из widgets/chat.                                         |
| [pages/stack/components](../src/pages/stack/components/README.md)               | Плейграунд UI-кита — экран-оглавление и демо-экраны компонентов, каждый отдельным маршрутом стека.              |
| [pages/stack/container-scanner](../src/pages/stack/container-scanner/README.md) | Сканер кода морского контейнера (ISO 6346) — камера в BottomSheet и расшифровка результата.                     |
| [pages/stack/files](../src/pages/stack/files/README.md)                         | «Мои файлы» — список файлов с бесконечной подгрузкой, загрузкой и удалением по правам.                          |
| [pages/stack/object-scanner](../src/pages/stack/object-scanner/README.md)       | Детекция объектов моделью object_detector — камера в BottomSheet, список найденного.                            |
| [pages/stack/pdf-view](../src/pages/stack/pdf-view/README.md)                   | Модальный просмотр PDF по URL с полосой прогресса и повтором при ошибке.                                        |
| [pages/stack/plate-scanner](../src/pages/stack/plate-scanner/README.md)         | Сканер российских автономеров — камера в BottomSheet, номер с регионом на странице.                             |
| [pages/stack/profile](../src/pages/stack/profile/README.md)                     | «Профиль» — аватар, личные данные и контакты, приватность; правка в шторке из навбара.                          |
| [pages/stack/recovery-password](../src/pages/stack/recovery-password/README.md) | Экран запроса ссылки для сброса пароля — AuthLayout и форма восстановления.                                     |
| [pages/stack/security](../src/pages/stack/security/README.md)                   | «Безопасность» — email, username, пароль, 2FA, сессии, выход везде и удаление аккаунта.                         |
| [pages/stack/sign-in](../src/pages/stack/sign-in/README.md)                     | Экран входа — тонкая композиция AuthLayout и формы входа с биометрией в слоте альтернатив.                      |
| [pages/stack/sign-up](../src/pages/stack/sign-up/README.md)                     | Экран регистрации — AuthLayout и форма регистрации со ссылкой на вход.                                          |
| [pages/stack/text-scanner](../src/pages/stack/text-scanner/README.md)           | Распознавание произвольного текста камерой — строки на лету в BottomSheet и на странице.                        |
| [pages/stack/web-view](../src/pages/stack/web-view/README.md)                   | Модальный встроенный браузер по URL с полосой прогресса загрузки.                                               |
| [pages/tabs/main](../src/pages/tabs/main/README.md)                             | Стартовая вкладка — ImageBar и лента карточек AnchorList с pull-to-refresh и синхронизацией навбара и таб-бара. |
| [pages/tabs/playground](../src/pages/tabs/playground/README.md)                 | Вкладка Playground — кнопки перехода на демо-экраны стека (PDF, WebView, кит, чат, сканеры).                    |
| [pages/tabs/settings](../src/pages/tabs/settings/README.md)                     | Вкладка «Настройки» — меню приложения из widgets/app-menu с переходом карточки профиля в навбар.                |

## shared

| Модуль                                                                    | О чём                                                                                                                                                           |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [shared/api](../src/shared/api/README.md)                                 | Конкретные бэкенды поверх shared/lib/http — основной (orval-генерация) и DummyJSON (рукописный), их сессии, HTTP-клиенты и DI-регистрация.                      |
| [shared/config](../src/shared/config/README.md)                           | Конфигурация окружения и сборки — URL бэкенда и сокета, deeplink, GitHub OAuth из react-native-config, имя и версия приложения.                                 |
| [shared/lib/access](../src/shared/lib/access/README.md)                   | Грамматика строковых прав — wildcard-иерархия `домен:*`, полный доступ `*`, область «все / свои» через суффикс `:own`.                                          |
| [shared/lib/animation](../src/shared/lib/animation/README.md)             | Анимационные примитивы над shared values — интерполяция источника в диапазон и тип «число или shared value».                                                    |
| [shared/lib/app-state](../src/shared/lib/app-state/README.md)             | Сервис активности приложения (активно / в фоне) поверх RN `AppState` — DI-абстракция для кода вне React.                                                        |
| [shared/lib/bars](../src/shared/lib/bars/README.md)                       | Примитив скрываемой панели (IBar) — state machine видимости на shared values без знания о скролле и визуале.                                                    |
| [shared/lib/container-ocr](../src/shared/lib/container-ocr/README.md)     | Домен кода контейнера ISO 6346 — контрольная цифра, кандидаты из OCR с перебором подстановок, типоразмер и веса с таблички.                                     |
| [shared/lib/contracts](../src/shared/lib/contracts/README.md)             | Узкие DI-контракты между слайсами одного слоя — интерфейс с токеном в shared, реализацию биндит владелец.                                                       |
| [shared/lib/di](../src/shared/lib/di/README.md)                           | Inversify-контейнер приложения и фабрика токенов `createInjectDecorator` (инъекция, getInstance, useInstance), утилиты освобождения ресурсов.                   |
| [shared/lib/files](../src/shared/lib/files/README.md)                     | Локальный файл для multipart-загрузки в React Native — тип `ILocalFile`, `toFormFile` для FormData, `toFileUri`.                                                |
| [shared/lib/holders](../src/shared/lib/holders/README.md)                 | MobX-холдеры асинхронного состояния (сущность, коллекция, страницы, бесконечный список, курсор, мутация, поллинг, фильтры) и React-хуки над ними.               |
| [shared/lib/hooks](../src/shared/lib/hooks/README.md)                     | Общие React-хуки без домена — состояние, стабильные ссылки и колбэки, измерение layout, буфер обмена, анимации на Reanimated.                                   |
| [shared/lib/http](../src/shared/lib/http/README.md)                       | HTTP-движок без знания эндпоинтов — клиент, пайплайн middleware, нормализованные ошибки ApiError, отмена, axios-транспорт, тестовый транспорт.                  |
| [shared/lib/keyboard](../src/shared/lib/keyboard/README.md)               | Покадровая высота клавиатуры на UI-потоке — низкоуровневый источник для компенсаций, без знания о safe area и панелях.                                          |
| [shared/lib/keyboard-aware](../src/shared/lib/keyboard-aware/README.md)   | Поле формы целиком над клавиатурой в скролле — покадровая докрутка, распорка, реестр полей и возврат скролла при закрытии.                                      |
| [shared/lib/live](../src/shared/lib/live/README.md)                       | Живые данные сокета в MobX-модели со стабильным объектом — снимок, скользящее окно точек и перечитывание после паузы.                                           |
| [shared/lib/media](../src/shared/lib/media/README.md)                     | DI-сервис доступа к медиа-устройствам (getUserMedia, остановка потока) поверх react-native-webrtc.                                                              |
| [shared/lib/media-picker](../src/shared/lib/media-picker/README.md)       | Выбор фото из галереи, снимок камерой и выбор файлов — единый результат ILocalFile[] и типизированная ошибка.                                                   |
| [shared/lib/models](../src/shared/lib/models/README.md)                   | Базовые MobX-модели поверх DTO — DataModelBase, мемоизированный маппер DTO → модель, модель enum с isX-геттерами, DateModel.                                    |
| [shared/lib/navigation](../src/shared/lib/navigation/README.md)           | Типизированная навигация поверх React Navigation — общий ref контейнера, INavigationService вне React, хуки экранов, готовность экрана после анимации перехода. |
| [shared/lib/network](../src/shared/lib/network/README.md)                 | Сервис статуса сети поверх NetInfo — `isOnline` и колбэки переходов онлайн/офлайн для кода вне React.                                                           |
| [shared/lib/notifications](../src/shared/lib/notifications/README.md)     | Тост-уведомления — singleton-стор с очередью, дедупликацией по key и таймерами, API в React и вне его, хост-компонент на Reanimated.                            |
| [shared/lib/object-scan](../src/shared/lib/object-scan/README.md)         | Сканер объектов камеры — детекция моделью на worklet-потоке, боксы для оверлея и троттлящийся поток объектов в JS.                                              |
| [shared/lib/ocr-scan](../src/shared/lib/ocr-scan/README.md)               | Универсальный OCR-сканер кадра камеры — конвейер детекция → отбор регионов → чтение, доменная стабилизация и примитивы frame-пайплайна.                         |
| [shared/lib/plate-ocr](../src/shared/lib/plate-ocr/README.md)             | Домен российского автономера — кандидаты из строк OCR, разбор на номер и регион, вывод кириллицей как на знаке.                                                 |
| [shared/lib/pull-to-refresh](../src/shared/lib/pull-to-refresh/README.md) | Логика pull-to-refresh — state machine на shared values и адаптеры ввода (скролл, жест, AnchorList); визуал строится на месте вызова.                           |
| [shared/lib/scan-overlay](../src/shared/lib/scan-overlay/README.md)       | Данные оверлея сканера — боксы снимка кадра, cover-маппинг в пиксели вью и сглаживание движения рамок.                                                          |
| [shared/lib/scroll](../src/shared/lib/scroll/README.md)                   | Телеметрия скролла на shared values — единственный владелец onScroll, на котором строятся панели, pull-to-refresh и reveal.                                     |
| [shared/lib/scroll-reveal](../src/shared/lib/scroll-reveal/README.md)     | Переход содержимого при уходе якоря за верх скролла (например, в шапку) — контроллер прогресса, якорь и контекст скролла экрана.                                |
| [shared/lib/search](../src/shared/lib/search/README.md)                   | Контроллер поиска экрана, синхронизация со скрываемой шапкой и чистые функции сопоставления текста, подсветки и истории.                                        |
| [shared/lib/session](../src/shared/lib/session/README.md)                 | Общая механика токенов бэкенда — TokenSession (хранение, дедупликация refresh, тихое обновление по expiresIn, конец сессии), хранилища токенов.                 |
| [shared/lib/slots](../src/shared/lib/slots/README.md)                     | Compound-компоненты на слотах — схема слотов, разбор children за один проход, слияние props, createCompound.                                                    |
| [shared/lib/socket](../src/shared/lib/socket/README.md)                   | Socket.IO-транспорт — одно соединение с токеном через контракт ITokenProvider, переподключение, приостановка в фоне, комнаты со счётчиком подписок, React-хуки. |
| [shared/lib/splash](../src/shared/lib/splash/README.md)                   | JS-обёртка над нативным splash-экраном — скрыть, когда первый экран готов, и проверить видимость.                                                               |
| [shared/lib/storage](../src/shared/lib/storage/README.md)                 | Синхронное key-value хранилище приложения — контракт IStorageService и реализация на MMKV.                                                                      |
| [shared/lib/theme](../src/shared/lib/theme/README.md)                     | Светлая и тёмная темы — ThemeStore с предпочтением Light/Dark/System, ThemeProvider, useTheme и кэширующая фабрика стилей makeThemeStyles.                      |
| [shared/lib/utils](../src/shared/lib/utils/README.md)                     | Общие чистые утилиты без домена — форматирование дат и размеров, склонение, строки, type guards, LambdaValue, освобождение ресурсов.                            |
| [shared/lib/validation](../src/shared/lib/validation/README.md)           | Хелперы схем Zod для форм — discriminated union по boolean-полю, проверка с путём ошибки поля, необязательное число, русская локаль сообщений.                  |
| [shared/lib/webrtc](../src/shared/lib/webrtc/README.md)                   | DI-сервис WebRTC-примитивов — peer connection, offer/answer, удалённое описание и ICE-кандидаты поверх react-native-webrtc.                                     |
| [shared/ui](../src/shared/ui/README.md)                                   | UI-кит на React Native + Reanimated — инвентарь компонентов, правила кита и gotcha.                                                                             |
| [shared/ui/flex-view](../src/shared/ui/flex-view/README.md)               | Утилитарные layout-пропсы поверх style (FlexView, Row, Col, useFlexProps) — конвертация без аллокаций для всех примитивов кита.                                 |

## widgets

| Модуль                                                      | О чём                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [widgets/app-menu](../src/widgets/app-menu/README.md)       | Меню вкладки «Настройки» — профиль, разделы аккаунта, тема, биометрия, выход и версия.                              |
| [widgets/app-shell](../src/widgets/app-shell/README.md)     | Нижний таб-бар приложения — компонент для навигатора, контекст панели, скрытие при скролле и высота для отступов.   |
| [widgets/auth-layout](../src/widgets/auth-layout/README.md) | Оформление экранов входа, регистрации и восстановления пароля без шапки навигатора.                                 |
| [widgets/chat](../src/widgets/chat/README.md)               | Экран переписки — список сообщений на AnchorList, панель ввода, меню действий, цитаты и сохранение позиции скролла. |
