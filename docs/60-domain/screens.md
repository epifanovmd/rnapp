---
id: domain/screens
title: Экраны и навигация
summary: Корневой стек с guard-группами, вкладки, экраны стека и их слайсы, бутстрап, deep linking, обновление данных после переподключения.
layer: project
roles: [developer, architect]
stages: [analysis, planning]
depends_on: [domain/overview, architecture/navigation]
---

# Экраны и навигация

Принципы — [architecture/navigation](../20-architecture/navigation.md), устройство —
[app](../../src/app/README.md).

## Корневой стек

React Navigation 7, static API: `app/App.screens.ts` — корневой стек с guard-группами
`Private` (`if: useIsSignedIn`) и `Public` (`if: useIsSignedOut`). Смена авторизации
переключает стек сама. Экраны сгруппированы по навигаторам: `pages/stack/<slice>`,
`pages/tabs/<slice>`.

## Public

| Экран            | Слайсы                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| SignIn           | `widgets/auth-layout`, `features/sign-in`, `features/biometric` (слот) |
| SignUp           | `widgets/auth-layout`, `features/sign-up`                              |
| RecoveryPassword | `widgets/auth-layout`, `features/recovery-password`                    |

## Private

- **Вкладки** (`app/app-tab-screens.tsx`, `pages/tabs/`): Main (демо-лента: шапка-картинка,
  скрываемые панели, pull-to-refresh), Playground, Settings.
  Settings — меню `widgets/app-menu`: профиль, аккаунт, данные, тема, биометрия, выход.
- **Стек** (`pages/stack/`):

| Экран                              | Слайсы                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| Profile                            | `features/profile-settings`, `features/edit-profile`, `entities/user`                               |
| Security                           | `features/account-security`, `features/sign-out`                                                    |
| Audit                              | `entities/audit`                                                                                    |
| Files                              | `entities/file`, `features/file-upload`, `features/delete-file`; «Мои / Все» и удаление — по правам |
| Chat                               | `widgets/chat`, `entities/message`                                                                  |
| Text/Object/Plate/ContainerScanner | `features/{text,object,plate,container}-scan`                                                       |
| PdfView, WebView                   | просмотр документа и веб-страницы                                                                   |
| Components                         | плейграунд кита: ссылки и демо-экраны `Components<Name>`                                            |

## Жизненный цикл

- Бутстрап — `app/hooks/useAppBootstrap.ts` на готовности навигатора: восстановление
  сессии и загрузка биометрии параллельно (сбой шага не оставляет приложение под
  splash), скрытие splash, при отсутствии сессии — тихая попытка входа по биометрии.
- Deep linking — пути в static-конфиге экранов (`linking:`), префиксы —
  `app/App.linking.ts`.
- Реалтайм user/file/audit стартует в `AppDataStore` при входе и сбрасывается при выходе
  вместе с данными пользователя. После переподключения сокета (обрыв или возврат из фона)
  каждый реалтайм перечитывает уже загруженное.
