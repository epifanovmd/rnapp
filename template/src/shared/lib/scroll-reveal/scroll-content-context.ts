import { createContext, RefObject, useContext } from "react";
import type { View } from "react-native";

import type { TAnimatedNumber } from "../animation";
import type { IScrollValues } from "../scroll";

/**
 * Скролл экрана для его содержимого: телеметрия, контейнер контента (от него
 * меряются якоря), перекрытие сверху и прокрутка к началу. Даёт прокручиваемый
 * экран (`ScreenScroll`); любой потомок на любой глубине читает его без пропсов.
 */
export interface IScrollContent {
  telemetry: IScrollValues;
  /** Контейнер контента: положения якорей — относительно него (= координаты скролла). */
  contentRef: RefObject<View | null>;
  /** Перекрытие верха (прозрачный навбар): видимая область начинается ниже. */
  topInset: TAnimatedNumber;
  /** Подписка на смену раскладки контента — якоря перемеряются. */
  subscribeLayout: (listener: () => void) => () => void;
  /** Прокрутка к началу. */
  scrollToTop: (animated?: boolean) => void;
}

export const ScrollContentContext = createContext<IScrollContent | null>(null);

/** Скролл экрана, внутри которого рендерится компонент (`null` — вне его). */
export const useScrollContent = (): IScrollContent | null =>
  useContext(ScrollContentContext);
