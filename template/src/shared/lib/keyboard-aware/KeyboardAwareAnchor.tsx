import React, { FC } from "react";
import Animated from "react-native-reanimated";

import { IKeyboardAwareScroll } from "./useKeyboardAwareScroll";

export interface IKeyboardAwareAnchorProps {
  controller: IKeyboardAwareScroll;
}

/**
 * Нулевой якорь — первый элемент контента (шапка списка): от него поля
 * меряются в координатах контента в одном снимке раскладки.
 */
export const KeyboardAwareAnchor: FC<IKeyboardAwareAnchorProps> = ({
  controller,
}) => (
  <Animated.View
    ref={controller.contentAnchorRef}
    collapsable={false}
    pointerEvents={"none"}
  />
);
