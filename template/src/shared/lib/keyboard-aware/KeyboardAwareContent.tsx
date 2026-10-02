import React, { FC, PropsWithChildren } from "react";

import { KeyboardAwareContext } from "./keyboard-aware-context";
import { KeyboardAwareSpacer } from "./KeyboardAwareSpacer";
import { IKeyboardAwareScroll } from "./useKeyboardAwareScroll";

export interface IKeyboardAwareContentProps {
  controller: IKeyboardAwareScroll;
}

/** Контент keyboard-aware скролла: реестр полей для детей и распорка в конце. */
export const KeyboardAwareContent: FC<
  PropsWithChildren<IKeyboardAwareContentProps>
> = ({ controller, children }) => (
  <KeyboardAwareContext.Provider value={controller.registry}>
    {children}
    <KeyboardAwareSpacer controller={controller} />
  </KeyboardAwareContext.Provider>
);
