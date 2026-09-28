import { IChatMessage } from "@entities/message";
import { ContextMenuView } from "@shared/ui";
import React, { FC, memo, ReactNode, useCallback, useMemo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { buildMessageActions, MessageActionId } from "../model/message-actions";

export interface IMessageActionsMenuProps {
  message: IChatMessage;
  children: ReactNode;
  /** Стиль обёртки: по ней меню снимает снимок сообщения. */
  style?: StyleProp<ViewStyle>;
  /** Выбран пункт меню. */
  onAction: (action: MessageActionId, message: IChatMessage) => void;
  /** Меню вот-вот откроется: под ним всё обязано встать на месте. */
  onOpen?: () => void;
  /** Меню закрылось — выбором или без него. */
  onClose?: () => void;
}

/**
 * Долгое нажатие на сообщение — меню его действий.
 *
 * Состав пунктов решает `buildMessageActions`, показывает их общий оверлей
 * контекстного меню; строке списка остаётся только принять выбор.
 */
export const MessageActionsMenu: FC<IMessageActionsMenuProps> = memo(
  ({ message, children, style, onAction, onOpen, onClose }) => {
    const actions = useMemo(() => buildMessageActions(message), [message]);

    const handleActionSelect = useCallback(
      (actionId: string) => {
        onClose?.();
        onAction(actionId as MessageActionId, message);
      },
      [message, onAction, onClose],
    );

    return (
      <ContextMenuView
        actions={actions}
        style={style}
        onWillShow={onOpen}
        onActionSelect={handleActionSelect}
        onDismiss={onClose}
      >
        {children}
      </ContextMenuView>
    );
  },
);

MessageActionsMenu.displayName = "MessageActionsMenu";
