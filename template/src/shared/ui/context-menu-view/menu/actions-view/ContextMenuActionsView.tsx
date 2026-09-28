import React, { FC, Fragment, memo } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { IContextMenuColors, IContextMenuStyles } from "../../config";
import { ContextMenuAction } from "../../types";
import { ActionRow } from "./ActionRow";

/** Список действий меню. */

export interface IContextMenuActionsViewProps {
  actions: ContextMenuAction[];
  colors: IContextMenuColors;
  styles: IContextMenuStyles;
  onActionTap: (action: ContextMenuAction) => void;
}

export const ContextMenuActionsView: FC<IContextMenuActionsViewProps> = memo(
  ({ actions, colors, styles, onActionTap }) => (
    <Animated.View style={styles.actionsPanel}>
      {actions.map((action, index) => (
        <Fragment key={action.id}>
          <ActionRow
            action={action}
            colors={colors}
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
