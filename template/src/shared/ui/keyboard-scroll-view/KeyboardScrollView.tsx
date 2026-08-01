import React, { forwardRef } from "react";
import { ScrollViewProps } from "react-native";
import { KeyboardChatScrollView } from "react-native-keyboard-controller";
import Reanimated, { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Скролл с компенсацией клавиатуры — порт `updateCollectionInsets`
 * из `ChatViewController` (IOSChatView).
 *
 * Нативный эталон работает так: коллекция всегда занимает всю высоту экрана и
 * никогда не двигается; панель ввода прижата к `keyboardLayoutGuide`, а зона,
 * которую она вместе с клавиатурой перекрывает снизу, компенсируется
 * **contentInset.bottom** + коррекцией `contentOffset` (расстояние до конца
 * контента сохраняется). Именно поэтому в нативе верх списка всегда доступен:
 * сдвигается содержимое скролла, а не сама вьюха.
 *
 * Здесь то же самое: `KeyboardChatScrollView` покадрово на UI-потоке ведёт
 * `contentInset.bottom` (iOS) / нижний паддинг скролла (Android) и синхронно
 * правит `contentOffset`. Никаких `translateY` контейнера — верх контента
 * не уезжает за границу экрана.
 *
 * Постоянная часть нижней зоны (панель ввода + safe area) остаётся обычным
 * `contentContainerStyle.paddingBottom` хоста: она меняется редко и должна
 * учитываться в размере контента (от неё зависит `scrollToEnd`, автоскролл
 * и `maintainVisibleContentPosition`). Клавиатура же добавляет к ней только
 * разницу `keyboardHeight - bottomOffset` — за это отвечает проп `offset`.
 *
 * Использование:
 * ```tsx
 * <KeyboardScrollView
 *   contentContainerStyle={{ paddingBottom: safeAreaBottom + inputBarHeight }}
 * >
 *   {content}
 * </KeyboardScrollView>
 * ```
 * Для FlashList — тот же компонент в `renderScrollComponent`.
 */

export type KeyboardLiftBehavior =
  "always" | "whenAtEnd" | "persistent" | "never";

export interface IKeyboardScrollViewProps extends ScrollViewProps {
  /**
   * Расстояние от нижнего края скролла до низа экрана, которое уже учтено в
   * `contentContainerStyle.paddingBottom`. Клавиатура добавит только
   * `keyboardHeight - bottomOffset`. По умолчанию — нижний safe area inset.
   */
  bottomOffset?: number;
  /**
   * Когда контент поднимается вслед за клавиатурой. `always` — как в нативном
   * чате (порт `updateCollectionInsets`, которому всё равно, где скролл).
   */
  liftBehavior?: KeyboardLiftBehavior;
  /**
   * Заморозка: пока `true`, события клавиатуры игнорируются — ни отступ, ни
   * позиция скролла не меняются. Порт `KeyboardFreezeManager`: контекстное меню
   * снимает снапшот ячейки и на время показа ничего не должно двигаться.
   */
  freeze?: SharedValue<boolean>;
}

export const KeyboardScrollView = forwardRef<
  Reanimated.ScrollView,
  IKeyboardScrollViewProps
>(({ bottomOffset, liftBehavior = "always", freeze, ...rest }, ref) => {
  const safeArea = useSafeAreaInsets();

  return (
    <KeyboardChatScrollView
      ref={ref}
      offset={bottomOffset ?? safeArea.bottom}
      keyboardLiftBehavior={liftBehavior}
      freeze={freeze}
      // Порт `contentInsetAdjustmentBehavior = .never`: единственный источник
      // нижнего отступа — расчёт ниже, системные подгонки только мешают.
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior={"never"}
      {...rest}
    />
  );
});

KeyboardScrollView.displayName = "KeyboardScrollView";
