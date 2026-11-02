---
module: widgets/app-menu
summary: Меню вкладки «Настройки» — профиль, разделы аккаунта, тема, биометрия, выход и версия.
---

# app-menu

Содержимое вкладки настроек и её навбар: карточка профиля уезжает в навбар при прокрутке.

## Public API

| Экспорт         | Что                                                                      |
| --------------- | ------------------------------------------------------------------------ |
| `AppMenu`       | observer-меню; проп `reveal?: IScrollReveal` — переход карточки в навбар |
| `AppMenuNavbar` | навбар вкладки; пропсы `title`, `reveal` (тот же контроллер, что у меню) |

## Устройство

- `model/constants.ts` — `APP_MENU_GROUPS`: «Аккаунт» (Security, Audit), «Данные» (Files).
  Пункт с полем `permission` скрывается без права (`IUserStore.can`), пустая группа — тоже.
- `model/useMenuProfile.ts` — имя, логин и аватар из `IUserStore.model`; читать в observer.
- `ui/AppMenu.tsx`: карточка `AppMenuProfile` (тап → Profile), при `reveal` — в
  `ScrollRevealAnchor`; группы пунктов (`ListItem` → `navigate(route)`); группа «Приложение» —
  `ThemeMenuItem` и `BiometricMenuItem`; `SignOutButton`; версия `APP_VERSION`.
- `ui/AppMenuNavbar.tsx`: `NavbarReveal` по `reveal.progress` показывает заголовок, а когда
  карточка ушла под навбар — `AppMenuProfileCompact`; тап — `reveal.scrollToTop`.
- `ui/ThemeMenuItem.tsx` — тумблер тёмной темы (`useTheme().toggleTheme`).

## Зависимости

- `@entities/user` (`IUserStore`), `@features/biometric` (`BiometricMenuItem`),
  `@features/sign-out` (`SignOutButton`).
- `@shared/lib/{navigation,theme,scroll-reveal}`, `@shared/ui`, `@shared/config/app-info`.
- Используется: `pages/tabs/settings`.

## Gotcha

- Маршруты пунктов ограничены типом `TAppMenuRoute` — новый пункт требует расширить тип.
- `BiometricMenuItem` при каждом монтировании вызывает `IBiometricStore.sync()` (сверка с
  сервером).
