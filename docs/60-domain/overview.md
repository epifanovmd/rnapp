---
id: domain/overview
title: Продукт и стек
summary: Что за приложение, разделы, бэкенд и стек React Native.
layer: project
roles: [all]
stages: [intake, analysis]
depends_on: []
---

# Продукт и стек

Мобильное приложение на React Native поверх бэкенда `rest-api-template-app`: аккаунт,
файлы, журнал, сканеры на камере, чат и плейграунд UI-кита.

## Разделы

| Раздел             | Что делает пользователь                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| вход и регистрация | вход по паролю, второй фактор, биометрия, GitHub OAuth, регистрация, сброс |
| главная            | демо-лента со скрываемыми панелями и pull-to-refresh (вкладка Main)        |
| настройки          | меню аккаунта, тема, биометрия, выход (вкладка Settings)                   |
| профиль            | данные профиля, аватар, приватность                                        |
| безопасность       | email, имя пользователя, пароль, 2FA, сессии, удаление аккаунта            |
| журнал             | история своих действий                                                     |
| файлы              | загрузка, список, удаление                                                 |
| сканеры            | текст, объекты, автономера, коды контейнеров (VisionCamera + VisionEngine) |
| чат                | лента сообщений на AnchorList с полем ввода и контекстным меню             |
| плейграунд         | демо-экраны компонентов кита (вкладка Playground → Components)             |

Экраны и навигация — [screens](screens.md), термины — [glossary](glossary.md).

## Бэкенд

`rest-api-template-app`: REST API, Socket.IO, OpenAPI-спецификация для генерации
клиента. Адреса — по окружению сборки ([ops/environment](../70-ops/environment.md)).

## Стек

React Native 0.86 (New Architecture: Fabric/TurboModules, Hermes), React 19,
TypeScript, MobX 6, Inversify 8 (DI), React Navigation 7 (static API), Axios + orval,
Socket.IO 4, React Hook Form 7 + Zod 4, Reanimated + react-native-worklets,
react-native-keyboard-controller, Skia, VisionCamera 5 (Nitro, frame-worklets), MMKV,
date-fns, Jest. Node ≥ 22.11, Yarn 1.
