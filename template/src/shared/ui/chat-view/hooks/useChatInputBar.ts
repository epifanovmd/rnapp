import { useCallback, useMemo, useRef } from "react";
import { SharedValue } from "react-native-reanimated";

import { IInputBarViewDelegate, InputBarMode } from "../../input-bar";
import { IChatViewFeatures } from "../config";
import { IParsedChatMessage } from "../data";
import { chatVoicePlayer } from "../services";
import { ChatInputAction, ChatViewProps } from "../types";
import { IChatOverlaysController } from "./useChatOverlays";
import { IChatScrollController } from "./useChatScroll";

/**
 * Панель ввода.
 *
 * Две обязанности: превратить `inputAction` в режим панели с разрешёнными
 * данными сообщения и развести события панели по чату (отправка ставит
 * отложенный скролл вниз, запись голоса ставит плеер на паузу).
 */

export interface IChatInputBarOptions {
  inputAction: ChatInputAction | null | undefined;
  messageIndex: Map<string, IParsedChatMessage>;
  props: React.RefObject<ChatViewProps>;
  scroll: IChatScrollController;
  overlays: IChatOverlaysController;
  getFeatures: () => IChatViewFeatures;
  barHeight: SharedValue<number>;
}

export interface IChatInputBar {
  mode: InputBarMode;
  delegate: IInputBarViewDelegate;
  onHeightChange: (height: number) => void;
}

/** Разбор действия панели: reply / edit / обычный режим. */
const resolveInputMode = (
  action: ChatInputAction | null | undefined,
  messageIndex: Map<string, IParsedChatMessage>,
): InputBarMode => {
  if (!action || action.type === "none" || !action.messageId) {
    return { type: "normal" };
  }

  const message = messageIndex.get(action.messageId);

  if (!message) return { type: "normal" };

  if (action.type === "reply") {
    return {
      type: "reply",
      messageId: action.messageId,
      senderName: message.senderName,
      text: message.body.text,
      hasImage: message.body.media != null,
    };
  }

  return {
    type: "edit",
    messageId: action.messageId,
    text: message.body.text ?? "",
  };
};

export const useChatInputBar = ({
  inputAction,
  messageIndex,
  props,
  scroll,
  overlays,
  getFeatures,
  barHeight,
}: IChatInputBarOptions): IChatInputBar => {
  const lastTypingAtRef = useRef(0);

  const mode = useMemo(
    () => resolveInputMode(inputAction, messageIndex),
    [inputAction, messageIndex],
  );

  const delegate = useMemo<IInputBarViewDelegate>(
    () => ({
      onSend: (text, replyToId) => {
        // Своё сообщение всегда доезжает до низа.
        scroll.state.current.pendingScrollToBottom = true;
        overlays.setFabExpanded(false);
        props.current.onSendMessage?.({ text, replyToId });
      },
      onEdit: (text, messageId) =>
        props.current.onEditMessage?.({ text, messageId }),
      onCancelMode: type => {
        if (type !== "none") props.current.onCancelInputAction?.({ type });
      },
      onTapAttachment: () => props.current.onAttachmentPress?.({}),
      onVoiceRecordingComplete: result => {
        scroll.state.current.pendingScrollToBottom = true;
        props.current.onVoiceRecordingComplete?.(result);
      },
      onChangeText: text => {
        // FAB расходится, освобождая место под выросшую панель, только
        // когда в поле есть текст.
        if (getFeatures().showVoiceRecording) {
          overlays.setFabExpanded(text.trim().length > 0);
        }

        const throttleMs = props.current.inputTypingThrottle ?? 500;
        const now = Date.now();

        if (now - lastTypingAtRef.current >= throttleMs) {
          lastTypingAtRef.current = now;
          props.current.onInputTyping?.({ text });
        }
      },
      onRecordingStateChanged: isRecording => {
        if (isRecording) chatVoicePlayer.pauseIfPlaying();
        overlays.setFabHiddenForRecording(isRecording);
      },
    }),
    [scroll, overlays, props, getFeatures],
  );

  // Высота панели живёт только в shared value: она входит в нижнюю зону,
  // а та применяется на UI-потоке — ре-рендер чата тут не нужен.
  const onHeightChange = useCallback(
    (height: number) => {
      barHeight.value = height;
    },
    [barHeight],
  );

  return useMemo(
    () => ({ mode, delegate, onHeightChange }),
    [mode, delegate, onHeightChange],
  );
};
