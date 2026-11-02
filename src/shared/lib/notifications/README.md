---
module: shared/lib/notifications
summary: Тост-уведомления — singleton-стор с очередью, дедупликацией по key и таймерами, API в React и вне его, хост-компонент на Reanimated.
---

# notifications

Система всплывающих уведомлений. API одинаков в компонентах и вне React (сторы,
HTTP-middleware), отрисовкой занимается один `<NotificationHost />`.

## Public API

| Экспорт                | Что                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `INotificationService` | токен + API: `show`, `info`/`success`/`warning`/`error`/`loading`, `promise`, `update`, `dismiss`, `dismissAll`, `configure` |
| `INotificationStore`   | токен + внутренний контракт хоста: `visible`, `config`, `pauseTimer`/`resumeTimer`, `finalize`                               |
| `useNotifications()`   | `INotificationService` в компоненте                                                                                          |
| `NotificationHost`     | хост: рендерит видимые уведомления, монтируется один раз в `app`                                                             |
| `NotificationContent`  | стандартное содержимое уведомления (для кастомного `render`)                                                                 |
| `notificationModule`   | DI-модуль                                                                                                                    |
| типы                   | `NotificationOptions`, `NotificationInstance`, `NotificationConfig`, `NotificationVariant`, …                                |

## Устройство

- `notification.store.ts` — единственный источник истины: видимый стек, очередь,
  таймеры автоскрытия. `INotificationService` и `INotificationStore` указывают на один
  singleton (`toService`).
- Видимых не больше `maxVisible` (3), остальные ждут в очереди. Время жизни —
  4 с, у `error` — 6 с; `loading` — без автоскрытия (`duration: 0`).
- `key` — дедупликация: уведомление с тем же ключом обновляется, а не дублируется.
- `promise(p, { loading, success, error })` — одно уведомление loading → success/error;
  исходное значение или ошибка `p` возвращается как есть.
- Хост вызывает `finalize(id)` после анимации скрытия: до этого уведомление в
  `visible` с флагом `closing`.
- Haptic для success/warning/error и озвучивание скринридером — по `config`.

## Зависимости

- `mobx`, `react-native-reanimated`, `react-native-haptic-feedback`;
  `@shared/lib/di`, `@shared/lib/theme`, `@shared/lib/utils`, `@shared/ui/spinner`.
- Потребители: `shared/lib/http` (`notifyErrors`), `shared/api`, `app` (хост, модуль),
  `features/*`, `pages/stack`.

## Gotcha

- Уведомления, показанные до монтирования хоста, не теряются — появятся при его появлении.
- Если функция `messages.success/error` в `promise` бросает, уведомление загрузки
  снимается, а наружу всё равно уходит исходный результат.
- Бочка тянет RN-компоненты: DI-модули и типы для них (`shared/api`) импортируют
  `@shared/lib/notifications/notification.types` напрямую, чтобы не тащить UI.
