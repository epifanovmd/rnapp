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
import Animated, { useAnimatedRef } from "react-native-reanimated";

import { TBottomSheetContentProps } from "./types";

/**
 * Скролл контента шторки: gorhom поднимает шторку над клавиатурой, а этот
 * скролл докручивает форму к сфокусированному полю синхронно с клавиатурой.
 * Видимая область — целевая (низ — над футером, у верха клавиатуры), а не
 * текущая в кадре: шторка поднимается своей анимацией позже клавиатуры.
 * Распорки нет: шторка ужимается над клавиатурой, конец контента достижим.
 */
export const BottomSheetScrollContent = forwardRef<
  BottomSheetScrollViewMethods,
  TBottomSheetContentProps
>(({ children, keyboardBottomInset, ...rest }, ref) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const sheet = useBottomSheetInternal(true);
  const keyboardAware = useKeyboardAwareScroll(scrollRef, {
    spacer: false,
    keyboardAnchor:
      sheet && keyboardBottomInset
        ? { bottomInset: keyboardBottomInset, liftRoom: sheet.animatedPosition }
        : undefined,
  });

  return (
    <BottomSheetScrollView ref={mergeRefs([ref, scrollRef])} {...rest}>
      <KeyboardAwareContent controller={keyboardAware}>
        {children}
      </KeyboardAwareContent>
    </BottomSheetScrollView>
  );
});

BottomSheetScrollContent.displayName = "BottomSheetScrollContent";
