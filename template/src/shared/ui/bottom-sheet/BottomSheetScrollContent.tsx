import {
  BottomSheetScrollView,
  BottomSheetScrollViewMethods,
} from "@gorhom/bottom-sheet";
import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import {
  KeyboardAwareContent,
  useKeyboardAwareScroll,
} from "@shared/lib/keyboard-aware";
import React, { forwardRef } from "react";
import Animated, { useAnimatedRef } from "react-native-reanimated";

import { TBottomSheetContentProps } from "./types";

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
    const keyboardAware = useKeyboardAwareScroll(scrollRef, {
      spacer: false,
      restoreOnHide: restoreScrollOnKeyboardHide,
      containerShift,
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
