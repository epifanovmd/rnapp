import React, { FC, memo, useCallback, useSyncExternalStore } from "react";

import { useChatViewContext } from "../../../model";
import { chatVoicePlayer } from "../../../services";
import { ChatMessageOwnership } from "../../../types";
import { formatChatDuration } from "../../../utils";
import { ChatText } from "../../ChatText";

/** Таймер трека: перерисовывается раз в секунду, а не на каждый тик прогресса. */

interface IVoiceTimerProps {
  /** Идентификатор сообщения — им плеер опознаёт свой трек. */
  messageId: string;
  duration: number;
  ownership: ChatMessageOwnership;
}

export const VoiceTimer: FC<IVoiceTimerProps> = memo(
  ({ messageId, duration, ownership }) => {
    const { styles } = useChatViewContext();

    const seconds = useSyncExternalStore(
      chatVoicePlayer.subscribe,
      useCallback(
        () => chatVoicePlayer.getDisplayTime(messageId, duration),
        [messageId, duration],
      ),
    );

    return (
      <ChatText style={styles.byOwnership[ownership].voiceDuration}>
        {formatChatDuration(seconds)}
      </ChatText>
    );
  },
);

VoiceTimer.displayName = "VoiceTimer";
