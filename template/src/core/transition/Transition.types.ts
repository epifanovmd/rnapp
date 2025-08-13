import { ScrollHandlerProcessed, SharedValue } from "react-native-reanimated";

export interface ITransitionContext {
  isDrag: SharedValue<boolean>;
  transitionX: SharedValue<number>;
  transitionY: SharedValue<number>;
  onScroll: ScrollHandlerProcessed;
}
