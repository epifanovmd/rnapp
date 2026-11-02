---
module: app
summary: Композиционный корень — провайдеры, DI, навигаторы и экраны, deep linking, бутстрап и данные сессии.
---

# app

Собирает приложение: регистрирует DI-модули, монтирует глобальные провайдеры и хосты, описывает
навигацию (static API React Navigation 7) и связывает жизненный цикл сессии с realtime-подписками.
Слайсов нет — файлы и сегменты верхнего уровня.

## Public API

Барреля нет. Точка входа — `App` из `App.tsx` (импортируется корневым `index.js`).

## Устройство

```
App.tsx               DI + аудио на уровне модуля, configure MobX, локаль date-fns; провайдеры и хосты
app.module.ts         registerContainerModules: unbindAll + load всех DI-модулей
App.navigator.tsx     createStaticNavigation(RootStack), тема, onReady = useAppBootstrap
App.screens.ts        RootStack: группы Private / Public, общий header, переход
app-tab-screens.tsx   MainTabs (Main, Playground, Settings) + MainTabsLayout
App.linking.ts        prefixes `${DEEPLINK_BASE_URL}://`, enabled: "auto"
App.header.tsx        AppHeader — Navbar с «назад»; справа headerRight экрана или переключатель темы
App.notifications.tsx NotificationHost поверх всего UI
app-audio.ts          registerAudioBackends: аудиосессия iOS + бэкенд записи голосовых
app-data-*            IAppDataStore — данные и realtime на время сессии
common/               stackTransition — интерполятор перехода стека (сдвиг + прозрачность)
hooks/                useAppBootstrap, useAppNavigationTheme, useIsSignedIn/useIsSignedOut
```

- **Навигация.** `RootStack` — группы с guard'ами: `Private` (`if: useIsSignedIn`) и `Public`
  (`if: useIsSignedOut`: SignIn, SignUp, RecoveryPassword). При смене auth-состояния стек
  переключается сам — ручной `navigate` после входа/выхода не нужен. `Tabs` — экран стека с
  `layout: MainTabsLayout` (`NavbarProvider` + `TabBarProvider` на все табы), таб-бар —
  `AppTabBar` из `widgets/app-shell` (`hideMode="shrink"`).
- **Типизация.** `App.navigator.tsx` расширяет `RootNavigator` из `@react-navigation/core` типом
  `RootStack` — отсюда глобальный param list для `useNavigation`/`INavigationService`.
  Параметры экранов объявляют страницы.
- **Deep linking.** Пути — полем `linking:` у экранов в `App.screens.ts` и `app-tab-screens.tsx`;
  конфиг строится автоматически. У SignIn путь `signin` + alias `SignIn` — redirect_uri GitHub
  OAuth.
- **Провайдеры** (снаружи внутрь): GestureHandlerRoot → Theme → SafeArea → Keyboard →
  BottomSheetModal → AppNotifications → `Dialog.Host`, `ContextMenuView.Host`, навигатор.
- **Бутстрап** (`useAppBootstrap`, `onReady` навигатора): параллельно `authStore.restore()` и
  `biometricStore.load()` через `Promise.allSettled`, через 500 мс — хаптик, скрытие splash и,
  если сессии нет, `biometricStore.signIn({ auto: true })`. Сбой шага не оставляет приложение под splash
  (тест `hooks/__tests__/use-app-bootstrap.test.ts`).
- **AppDataStore** (`initialize` в `useEffect` компонента `App`): реакция на
  `IAuthStore.isAuthenticated`; уже авторизован — старт сразу.
  - вход: `userStore.load()`, `ISocketTransport.initialize()`, realtime user/file/audit;
  - выход: отписка и `reset()` user, sessions, file, audit — следующий вход может быть другим
    человеком;
  - dispose (размонтирование, Fast Refresh) — только отписка.
  - Тест — `__tests__/app-data-store.test.ts`.

## Зависимости

- Все слои: pages (экраны), `widgets/app-shell` (таб-бар), `features/biometric` (DI-модуль и
  бутстрап), `entities/{auth,user,file,audit}` (DI-модули, сторы и realtime).
- `@shared/lib/{di,navigation,notifications,socket,theme,splash,…}`, `@shared/api`,
  `@shared/ui`, `@shared/ui/input-bar`, `react-native-audio-api`.

## Gotcha

- `registerContainerModules()` и `registerAudioBackends()` вызываются при импорте `App.tsx`, до
  первого рендера; `unbindAll()` делает повторную регистрацию безопасной.
- Новый DI-модуль слайса регистрируется в `app.module.ts`, иначе `useInstance()` упадёт.
- `KeyboardProvider` стоит выше `BottomSheetModalProvider`: модальные шторки рендерятся порталом у
  своего провайдера, без контекста клавиатуры keyboard-controller в них не работает.
- `useIsSignedIn` читает стор через `IAuthStore.getInstance()` и `useSyncExternalStore`: пока
  идёт restore (`Loading`), активна группа Public — её закрывает splash.
- Экран стека задаёт действия шапки через `options.headerRight`; без них справа переключатель
  темы. `options.headerTitle`-функция подменяет содержимое центра шапки.
