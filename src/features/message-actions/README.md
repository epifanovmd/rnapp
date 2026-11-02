---
module: features/message-actions
summary: Контекстное меню сообщения — ответить, изменить, удалить.
---

# message-actions

Долгое нажатие на сообщение открывает меню действий. Состав пунктов решает чистая функция,
выбор уходит наверх колбэком — сама фича ничего не выполняет.

## Public API

| Экспорт                                          | Что                                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `MessageActionsMenu`, `IMessageActionsMenuProps` | обёртка `ContextMenuView`: `message`, `onAction`, `onOpen?`, `onClose?`, `style?` |
| `buildMessageActions`                            | пункты меню для сообщения                                                         |
| `MessageActionId`                                | `"reply" \| "edit" \| "delete"`                                                   |

## Устройство

- `model/message-actions.ts`: «Ответить» — всем; «Изменить» — своим, если вид содержимого
  правится (`isMessageEditable`); «Удалить» — своим. Тест —
  `model/__tests__/message-actions.test.ts`.
- `MessageActionsMenu`: `onWillShow` → `onOpen`; выбор пункта вызывает `onClose`, затем
  `onAction` (только для известного id); `onDismiss` → `onClose`.

## Зависимости

- `@entities/message` (`IChatMessage`, `isMessageEditable`), `@shared/ui` (`ContextMenuView`).
- Используется: `widgets/chat` (`ChatMessageRow`).

## Gotcha

- Меню снимает снимок ровно обёрнутого узла: `style` обёртки не должен растягивать её на всю
  ширину строки, иначе в снимок попадёт пустое место.
