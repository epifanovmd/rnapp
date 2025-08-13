import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import { ITransitionContext } from "../Transition.types";

export const useTransitionContext = (): ITransitionContext => {
  const isDrag = useSharedValue(false);
  const transitionX = useSharedValue(0);
  const transitionY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler(
    {
      onBeginDrag: () => {
        isDrag.value = true;
      },
      onEndDrag: () => {
        isDrag.value = false;
      },
      onScroll: event => {
        transitionX.value = event.contentOffset.x;
        transitionY.value = event.contentOffset.y;
      },
    },
    [],
  );

  return {
    isDrag,
    transitionX,
    transitionY,
    onScroll,
  };
};
