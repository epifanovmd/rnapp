import React, { FC, PropsWithChildren } from "react";

import { KeyboardAwareContext } from "./keyboard-aware-context";
import { KeyboardAwareAnchor } from "./KeyboardAwareAnchor";
import { KeyboardAwareSpacer } from "./KeyboardAwareSpacer";
import { IKeyboardAwareScroll } from "./useKeyboardAwareScroll";

export interface IKeyboardAwareContentProps {
  controller: IKeyboardAwareScroll;
}

/**
 * Контент keyboard-aware скролла: нулевой якорь первым (замер полей в
 * координатах контента), реестр полей для детей и распорка в конце.
 */
export const KeyboardAwareContent: FC<
  PropsWithChildren<IKeyboardAwareContentProps>
> = ({ controller, children }) => (
  <KeyboardAwareContext.Provider value={controller.registry}>
    <KeyboardAwareAnchor controller={controller} />
    {children}
    <KeyboardAwareSpacer controller={controller} />
  </KeyboardAwareContext.Provider>
);
