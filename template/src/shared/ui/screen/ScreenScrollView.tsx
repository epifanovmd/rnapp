import { TPullToRefreshScroll } from "@shared/lib/pull-to-refresh";
import React, {
  ComponentProps,
  createContext,
  forwardRef,
  useContext,
} from "react";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

/** Жест протяжки для ScrollView экрана; null — без pull-to-refresh. */
export const ScreenScrollGestureContext = createContext<
  TPullToRefreshScroll["gesture"] | null
>(null);

/**
 * ScrollViewComponent для KeyboardAwareScrollView: тот оборачивает скролл в
 * свою нативную view, поэтому GestureDetector ставится вплотную к самому
 * ScrollView здесь. Жест приходит контекстом — идентичность компонента
 * стабильна.
 */
export const ScreenScrollView = forwardRef<
  Animated.ScrollView,
  ComponentProps<typeof Animated.ScrollView>
>((props, ref) => {
  const gesture = useContext(ScreenScrollGestureContext);
  const scrollView = <Animated.ScrollView ref={ref} {...props} />;

  return gesture ? (
    <GestureDetector gesture={gesture}>{scrollView}</GestureDetector>
  ) : (
    scrollView
  );
});

ScreenScrollView.displayName = "ScreenScrollView";
