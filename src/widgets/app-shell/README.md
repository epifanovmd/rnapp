---
module: widgets/app-shell
summary: Нижний таб-бар приложения — компонент для навигатора, контекст панели, скрытие при скролле и высота для отступов.
---

# app-shell

Таб-бар навигатора на `TabBar` кита и слой управления им: панель прячется при скролле экрана,
экраны получают её высоту для нижнего отступа контента.

## Public API

| Экспорт                                                    | Что                                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `AppTabBar`, `IAppTabBarProps`                             | `tabBar` для bottom-tabs; `hideMode` + пропсы вида `ITabBarAppearance` |
| `TabBarProvider`, `useTabBar`                              | контекст панели (`createBarContext`); хук без провайдера кидает ошибку |
| `useTabBarHeight`                                          | измеренная высота панели — нижний отступ контента                      |
| `useTabBarScrollSync`                                      | поведение «спрятать/показать» по `IScrollValues` экрана                |
| `useTabBarStyle`, `TTabBarHideMode`                        | анимированный стиль скрытия: `slide` / `shrink` / `none`               |
| `accumulateToggle`, `TTabBarToggle`, `ITabBarToggleResult` | чистый worklet накопления порога                                       |

## Устройство

- Плоский слайс без сегментов. Состояние панели — `IBar` из `@shared/lib/bars` (offset,
  height, show/hide).
- `AppTabBar`: вкладки из опций экранов (`title`/`tabBarLabel`, `tabBarIcon`, `tabBarBadge`);
  `tabPress` с `canPreventDefault`, `tabLongPress`; смена индекса вызывает `tabBar.show()`.
  Высота пишется в `onLayout`; у плавающего варианта (`variant` по умолчанию `floating`) к ней
  добавляется нижний safe area.
- `useTabBarScrollSync`: у края списка (`resolveScrollEdge`) — сразу show/hide; иначе
  `accumulateToggle` копит дельту в одну сторону до 12 px и сбрасывает накопление после команды.
  Накопление сбрасывается и при показе панели, и вне фокуса экрана.
- `useTabBarStyle`: `shrink` — масштаб до 0.7 и сдвиг вниз по `barProgress`; `slide` —
  `translateY: offset`.

## Зависимости

- `@shared/lib/bars`, `@shared/lib/scroll` (тип), `@shared/ui` (`TabBar`), Reanimated,
  `@react-navigation/bottom-tabs`.
- Используется: `app` (`AppTabBar`, `TabBarProvider` в `MainTabsLayout`), `pages/tabs/*`
  (`useTabBarHeight`, `useTabBarScrollSync`).

## Gotcha

- `useTabBarScrollSync` захватывает shared values по одному: захват объекта телеметрии целиком
  клонировал бы его на UI-поток.
- Без сброса накопления после команды каждый следующий кадр скролла повторял бы hide/show и
  перезапускал анимацию (покрыто `__tests__/tab-bar-toggle.test.ts`).
