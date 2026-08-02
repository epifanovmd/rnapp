import React, { FC, memo } from "react";

import { useChatViewContext } from "../chat-view-context";
import { ChatText } from "../ChatText";

/** Счётчик непрочитанных на FAB: больше 99 показывается как «99+». */

interface IFabBadgeLabelProps {
  count: number;
}

export const FabBadgeLabel: FC<IFabBadgeLabelProps> = memo(({ count }) => {
  const { styles } = useChatViewContext();

  return (
    <ChatText style={styles.shared.fabBadgeText}>
      {count > 99 ? "99+" : `${count}`}
    </ChatText>
  );
});

FabBadgeLabel.displayName = "FabBadgeLabel";
