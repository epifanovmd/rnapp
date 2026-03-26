---
name: Screens & Navigation
description: Экраны приложения — public/private, tabs, stack, навигационная структура
type: project
---

## Public Screens (Authentication)
- **SignIn** — вход, биометрия
- **SignUp** — регистрация (email/phone validation)
- **RecoveryPassword** — восстановление пароля

## Private Screens

### Tab Navigator (MAIN)
- **Main** — главный экран с ContextMenuView (нативный)
- **Playground** — dev/test экран
- **Settings** — настройки, биометрия, тема

### Stack Screens
- **Components** — витрина компонентов (внутренние top tabs: Buttons, Notifications, Modals, Pickers, Elements)
- **Carousel** — карусель
- **PdfView** — PDF viewer (modal)
- **WebView** — web content (modal)

## Навигационная структура

```
App.navigator.tsx
├── PUBLIC_SCREENS (если !isAuthenticated)
│   ├── SignIn
│   ├── SignUp
│   └── RecoveryPassword
└── PRIVATE_SCREENS (если isAuthenticated)
    ├── MAIN (TabNavigator)
    │   ├── Main
    │   ├── Playground
    │   └── Settings
    ├── Components
    ├── Carousel
    ├── PdfView (modal)
    └── WebView (modal)
```

## NavigationService
- IoC singleton
- Tracks history (array of route names)
- Methods: navigate, goBack, resetRoot, getCurrentRoute
- Используется для programmatic navigation из stores
