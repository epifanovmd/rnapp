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
 * скролл докручивает форму к сфокусированному полю. Распорки нет — шторка
 * сама ужимается над клавиатурой; видимая область берётся из реальной
 * геометрии после подъёма (`animatedPosition` шторки → пересчёт).
 */
export const BottomSheetScrollContent = forwardRef<
  BottomSheetScrollViewMethods,
  TBottomSheetContentProps
>(({ children, ...rest }, ref) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const sheet = useBottomSheetInternal(true);
  const keyboardAware = useKeyboardAwareScroll(scrollRef, {
    spacer: false,
    containerPosition: sheet?.animatedPosition,
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
