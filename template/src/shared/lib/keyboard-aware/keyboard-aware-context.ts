import { createContext } from "react";
import Animated, { AnimatedRef } from "react-native-reanimated";

/**
 * Реестр полей скролла: ключ — нативный тег TextInput (тот же, что `target`
 * у событий клавиатуры), значение — animated ref контейнера поля целиком.
 */
export interface IKeyboardAwareFieldRegistry {
  register: (tag: number, containerRef: AnimatedRef<Animated.View>) => void;
  unregister: (tag: number) => void;
  /** Высота поля изменилась (ошибка, описание, multiline) — пересчитать докрутку. */
  notifyLayout: () => void;
}

/** Реестр ближайшего keyboard-aware скролла; null — поле вне такого скролла. */
export const KeyboardAwareContext =
  createContext<IKeyboardAwareFieldRegistry | null>(null);
