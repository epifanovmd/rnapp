import React, { FC } from "react";
import Animated from "react-native-reanimated";

import { IKeyboardAwareScroll } from "./useKeyboardAwareScroll";

export interface IKeyboardAwareSpacerProps {
  controller: IKeyboardAwareScroll;
}

/**
 * Распорка под клавиатуру — последний элемент контента (футер списка). По её
 * верху считается конец контента, поэтому после неё отступов быть не должно.
 */
export const KeyboardAwareSpacer: FC<IKeyboardAwareSpacerProps> = ({
  controller,
}) => (
  <Animated.View
    ref={controller.spacerRef}
    collapsable={false}
    pointerEvents={"none"}
    style={controller.spacerStyle}
  />
);
