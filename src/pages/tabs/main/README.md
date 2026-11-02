---
module: pages/tabs/main
summary: Стартовая вкладка — ImageBar и лента карточек AnchorList с pull-to-refresh и синхронизацией навбара и таб-бара.
---

# main

Стартовая вкладка нижних табов (`initialRouteName: "Main"`). Экран `Main` навигатора
`MainTabs` (экран `Tabs` корневого стека, группа `Private`); параметров нет. Deep link —
`main`.

## Public API

| Экспорт | Что                           |
| ------- | ----------------------------- |
| `Main`  | Компонент экрана (`observer`) |

## Устройство

- Демо-раскладка: `ImageBar` (300 px, картинка picsum) с прозрачным `Navbar`, под ним
  `AnchorList` из 50 карточек фиксированной высоты; отступ под ImageBar — пустая шапка
  списка.
- Скролл-телеметрия (`useScrollTelemetry` + `ScrollProvider`) синхронизирует навбар
  (`useNavbarScrollSync`) и таб-бар (`useTabBarScrollSync`).
- Pull-to-refresh — `useAnchorListPullToRefresh` + `RefreshIndicator`; `onRefresh` —
  заглушка с задержкой 1,5 с. Нижний отступ списка — высота таб-бара.
- Данных, VM и сторов нет.

## Зависимости

- `@widgets/app-shell` — `useTabBarHeight`, `useTabBarScrollSync`.
- `@shared/lib/scroll`, `@shared/lib/pull-to-refresh`, `@shared/lib/theme`,
  `@shared/lib/navigation`, `@shared/ui`; `@epifanovmd/anchor-list`.
