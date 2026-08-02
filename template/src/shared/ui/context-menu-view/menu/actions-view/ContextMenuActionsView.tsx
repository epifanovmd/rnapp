import React, { FC, Fragment, memo } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { IContextMenuStyles, IContextMenuTheme } from "../../config";
import { ContextMenuAction } from "../../types";
import { ActionRow } from "./ActionRow";

/** Список действий меню — порт `ContextMenuActionsView`. */

export interface IContextMenuActionsViewProps {
  actions: ContextMenuAction[];
  theme: IContextMenuTheme;
  styles: IContextMenuStyles;
  onActionTap: (action: ContextMenuAction) => void;
}

export const ContextMenuActionsView: FC<IContextMenuActionsViewProps> = memo(
  ({ actions, theme, styles, onActionTap }) => (
    <Animated.View style={styles.actionsPanel}>
      {actions.map((action, index) => (
        <Fragment key={action.id}>
          <ActionRow
            action={action}
            theme={theme}
            styles={styles}
            onTap={onActionTap}
          />
          {index < actions.length - 1 && (
            <View style={styles.actionSeparator} />
          )}
        </Fragment>
      ))}
    </Animated.View>
  ),
);

ContextMenuActionsView.displayName = "ContextMenuActionsView";
