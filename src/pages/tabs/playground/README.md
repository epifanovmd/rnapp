---
module: pages/tabs/playground
summary: Вкладка Playground — кнопки перехода на демо-экраны стека (PDF, WebView, кит, чат, сканеры).
---

# playground

Вкладка-меню демо-экранов. Экран `Playground` навигатора `MainTabs` (экран `Tabs`
корневого стека, группа `Private`); параметров нет. Deep link — `playground`.

## Public API

| Экспорт      | Что                           |
| ------------ | ----------------------------- |
| `Playground` | Компонент экрана (`observer`) |

## Устройство

- `Navbar` с именем маршрута и список кнопок `navigation.navigate(...)`: `PdfView` и
  `WebView` (с тестовыми `title`/`url`), `Components`, `Chat`, `ContainerScanner`,
  `PlateScanner`, `TextScanner`, `ObjectScanner`.
- Нижний отступ скролла — высота таб-бара. Данных и VM нет.

## Зависимости

- `@widgets/app-shell` — `useTabBarHeight`.
- `@shared/lib/navigation`, `@shared/ui`.
- Целевые экраны — `pages/stack/*`; связь только через имена маршрутов.

## Gotcha

- Это единственная точка входа в демо-экраны стека (кроме deep link): новый демо-экран
  без кнопки здесь из UI недоступен.
