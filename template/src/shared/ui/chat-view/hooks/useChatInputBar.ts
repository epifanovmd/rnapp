import { RefObject, useCallback, useMemo, useRef } from "react";
import { SharedValue, withTiming } from "react-native-reanimated";

import { IInputBarViewDelegate, InputBarMode } from "../../input-bar";
import { ChatContentRegistry } from "../content";
import { IParsedChatMessage } from "../data";
import { chatVoicePlayer } from "../services";
import { ChatInputAction, ChatViewProps } from "../types";
import { IChatScrollControl } from "./useChatScrollControl";

/** Плавность расхождения FAB, когда панель ввода растёт под текст. */
const FAB_EXPAND_MS = 250;

/** Как часто наружу уходит событие набора текста. */
const TYPING_THROTTLE_MS = 500;

export interface IChatInputBarOptions {
  inputAction: ChatInputAction | null | undefined;
  messageIndex: Map<string, IParsedChatMessage>;
  contentTypes: ChatContentRegistry;
  props: RefObject<ChatViewProps>;
  scrollControl: IChatScrollControl;
  /** Высота панели: входит в нижнюю зону, применяется на UI-потоке. */
  barHeight: SharedValue<number>;
  /** 0..1 — расхождение FAB вверх, чтобы освободить место выросшей панели. */
  fabExpanded: SharedValue<number>;
  /** 1 — FAB спрятан на время записи голоса. */
  fabHiddenForRecording: SharedValue<number>;
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
  contentTypes: ChatContentRegistry,
): InputBarMode => {
  if (!action || action.type === "none" || !action.messageId) {
    return { type: "normal" };
  }

  const message = messageIndex.get(action.messageId);

  if (!message) return { type: "normal" };

  if (action.type === "reply") {
    const media = message.body.media;

    return {
      type: "reply",
      messageId: action.messageId,
      senderName: message.senderName,
      text: message.body.text,
      preview: media && contentTypes.get(media.type)?.preview?.(media),
    };
  }

  return {
    type: "edit",
    messageId: action.messageId,
    text: message.body.text ?? "",
  };
};

/**
 * Панель ввода: `inputAction` превращается в режим панели с данными
 * сообщения, события панели разводятся по чату.
 */
export const useChatInputBar = ({
  inputAction,
  messageIndex,
  contentTypes,
  props,
  scrollControl,
  barHeight,
  fabExpanded,
  fabHiddenForRecording,
}: IChatInputBarOptions): IChatInputBar => {
  const lastTypingAtRef = useRef(0);

  const mode = useMemo(
    () => resolveInputMode(inputAction, messageIndex, contentTypes),
    [inputAction, messageIndex, contentTypes],
  );

  const delegate = useMemo<IInputBarViewDelegate>(
    () => ({
      onSend: (text, replyToId) => {
        requestAnimationFrame(() => scrollControl.scrollToBottom(true));
        fabExpanded.value = withTiming(0, { duration: FAB_EXPAND_MS });
        props.current.onSendMessage?.(text, replyToId);
      },
      onEdit: (text, messageId) =>
        props.current.onEditMessage?.(text, messageId),
      onCancelMode: type => {
        if (type !== "none") props.current.onCancelInputAction?.(type);
      },
      onTapAttachment: () => props.current.onAttachmentPress?.(),
      onVoiceRecordingComplete: recording => {
        requestAnimationFrame(() => scrollControl.scrollToBottom(true));
        props.current.onVoiceRecordingComplete?.(recording);
      },
      onChangeText: text => {
        fabExpanded.value = withTiming(text.trim().length > 0 ? 1 : 0, {
          duration: FAB_EXPAND_MS,
        });

        const now = Date.now();

        if (now - lastTypingAtRef.current >= TYPING_THROTTLE_MS) {
          lastTypingAtRef.current = now;
          props.current.onInputTyping?.(text);
        }
      },
      onRecordingStateChanged: isRecording => {
        if (isRecording) chatVoicePlayer.pauseIfPlaying();
        fabHiddenForRecording.value = isRecording ? 1 : 0;
      },
    }),
    [scrollControl, props, fabExpanded, fabHiddenForRecording],
  );

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
