---
module: pages/tabs/settings
summary: Вкладка «Настройки» — меню приложения из widgets/app-menu с переходом карточки профиля в навбар.
---

# settings

Вкладка «Настройки»: профиль, разделы аккаунта, тема, биометрия, выход. Экран `Settings`
навигатора `MainTabs` (экран `Tabs` корневого стека, группа `Private`); параметров нет.
Deep link — `settings`.

## Public API

| Экспорт    | Что              |
| ---------- | ---------------- |
| `Settings` | Компонент экрана |

## Устройство

- Тонкая страница: `AppMenuNavbar` + `ScreenScroll` с `AppMenu`; весь состав меню
  (карточка профиля, Security/Audit/Files, тема, биометрия, выход, версия) — в виджете.
- `useScrollReveal()` передаётся в навбар и меню: при прокрутке карточка профиля
  переходит в навбар.
- Нижний отступ скролла — высота таб-бара (`bottomInset`).

## Зависимости

- `@widgets/app-menu` — `AppMenu`, `AppMenuNavbar`; `@widgets/app-shell` —
  `useTabBarHeight`.
- `@shared/lib/scroll-reveal`, `@shared/ui`.
