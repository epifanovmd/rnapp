import React, { FC, memo } from "react";
import { Text } from "react-native";

import { useChatViewContext } from "../chat-view-context";

/** Счётчик непрочитанных на FAB: больше 99 показывается как «99+». */

interface IFabBadgeLabelProps {
  count: number;
}

export const FabBadgeLabel: FC<IFabBadgeLabelProps> = memo(({ count }) => {
  const { styles } = useChatViewContext();

  return (
    <Text style={styles.shared.fabBadgeText}>
      {count > 99 ? "99+" : `${count}`}
    </Text>
  );
});

FabBadgeLabel.displayName = "FabBadgeLabel";
