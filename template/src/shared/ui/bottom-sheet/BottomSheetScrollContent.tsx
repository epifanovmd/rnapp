import {
  BottomSheetScrollView,
  BottomSheetScrollViewMethods,
  useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import {
  KeyboardAwareContent,
  useKeyboardAwareScroll,
} from "@shared/lib/keyboard-aware";
import React, { forwardRef } from "react";
import Animated, {
  useAnimatedRef,
  useDerivedValue,
} from "react-native-reanimated";

import { TBottomSheetContentProps } from "./types";

/** `SCROLLABLE_STATUS.LOCKED` gorhom — перечисление наружу не экспортируется. */
const GORHOM_SCROLLABLE_LOCKED = 0;

/**
 * Скролл контента шторки: шторку над клавиатурой двигает BottomSheetLayout
 * (покадрово, без gorhom), а этот скролл докручивает форму к полю синхронно
 * с клавиатурой. Видимая область — на конец анимации: замер в покое,
 * сдвинутый и ужатый по `containerShift`. Распорки нет: область формы
 * ужимается над клавиатурой, конец контента достижим.
 */
export const BottomSheetScrollContent = forwardRef<
  BottomSheetScrollViewMethods,
  TBottomSheetContentProps
>(
  (
    { children, containerShift, restoreScrollOnKeyboardHide = true, ...rest },
    ref,
  ) => {
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const { animatedScrollableStatus } = useBottomSheetInternal();
    // Пока шторка анимируется (рост контента меняет её высоту), gorhom держит
    // скролл заблокированным и возвращает его на место — докрутка к полю
    // ждёт конца анимации.
    const scrollLocked = useDerivedValue(
      () => animatedScrollableStatus.value === GORHOM_SCROLLABLE_LOCKED,
    );
    const keyboardAware = useKeyboardAwareScroll(scrollRef, {
      spacer: false,
      restoreOnHide: restoreScrollOnKeyboardHide,
      containerShift,
      scrollLocked,
    });

    return (
      <BottomSheetScrollView ref={mergeRefs([ref, scrollRef])} {...rest}>
        <KeyboardAwareContent controller={keyboardAware}>
          {children}
        </KeyboardAwareContent>
      </BottomSheetScrollView>
    );
  },
);

BottomSheetScrollContent.displayName = "BottomSheetScrollContent";
