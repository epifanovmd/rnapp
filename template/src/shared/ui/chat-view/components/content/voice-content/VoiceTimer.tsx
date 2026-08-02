import React, { FC, memo, useCallback, useSyncExternalStore } from "react";
import { Text } from "react-native";

import { chatVoicePlayer } from "../../../services";
import { ChatMessageOwnership } from "../../../types";
import { formatChatDuration } from "../../../utils";
import { useChatViewContext } from "../../chat-view-context";

/** Таймер трека: перерисовывается раз в секунду, а не на каждый тик прогресса. */

interface IVoiceTimerProps {
  url: string;
  duration: number;
  ownership: ChatMessageOwnership;
}

export const VoiceTimer: FC<IVoiceTimerProps> = memo(
  ({ url, duration, ownership }) => {
    const { styles } = useChatViewContext();

    const seconds = useSyncExternalStore(
      chatVoicePlayer.subscribe,
      useCallback(
        () => chatVoicePlayer.getDisplayTime(url, duration),
        [url, duration],
      ),
    );

    return (
      <Text style={styles.byOwnership[ownership].voiceDuration}>
        {formatChatDuration(seconds)}
      </Text>
    );
  },
);

VoiceTimer.displayName = "VoiceTimer";
