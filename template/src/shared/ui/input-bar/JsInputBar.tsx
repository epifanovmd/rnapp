import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { View } from "react-native";

import {
  ChatCellStore,
  ChatViewContext,
  IChatCellDelegate,
} from "../chat-view/components/chat-view-context";
import {
  CHAT_DEFAULT_FEATURES,
  CHAT_DEFAULT_LAYOUT,
  resolveChatTheme,
} from "../chat-view/model";
import {
  ChatInputBar,
  IChatInputBarDelegate,
  IChatInputBarRef,
} from "./ChatInputBar";
import { ChatInputMode } from "./input-bar-types";
import { IInputBarRef, InputBarProps } from "./types";

/**
 * React Native-реализация InputBar — точь-в-точь контракт RNInputBar.
 * Ядро — тот же порт InputBarView, что использует JsChatView.
 */
export const JsInputBar = forwardRef<IInputBarRef, InputBarProps>(
  (props, ref) => {
    const { theme = "light", placeholder, inputAction, style } = props;

    const propsRef = useRef(props);

    propsRef.current = props;

    const resolvedTheme = useMemo(() => resolveChatTheme(theme), [theme]);
    const layout = useMemo(() => {
      if (!placeholder) return CHAT_DEFAULT_LAYOUT;

      return { ...CHAT_DEFAULT_LAYOUT, inputPlaceholderText: placeholder };
    }, [placeholder]);

    const cellStoreRef = useRef<ChatCellStore | null>(null);

    if (!cellStoreRef.current) {
      cellStoreRef.current = new ChatCellStore();
    }

    const delegateStub = useRef<IChatCellDelegate>(
      null as unknown as IChatCellDelegate,
    );

    const contextValue = useMemo(
      () => ({
        theme: resolvedTheme,
        layout,
        features: CHAT_DEFAULT_FEATURES,
        listWidth: 0,
        delegate: delegateStub,
        cellStore: cellStoreRef.current!,
      }),
      [resolvedTheme, layout],
    );

    const mode: ChatInputMode = useMemo(() => {
      if (inputAction?.type === "reply") {
        return {
          type: "reply",
          messageId: inputAction.messageId ?? "",
          senderName: inputAction.senderName,
          text: inputAction.text,
          hasImage: inputAction.hasImage ?? false,
        };
      }
      if (inputAction?.type === "edit") {
        return {
          type: "edit",
          messageId: inputAction.messageId ?? "",
          text: inputAction.text ?? "",
        };
      }

      return { type: "normal" };
    }, [inputAction]);

    const delegate: IChatInputBarDelegate = useMemo(
      () => ({
        onSend: (text, replyToId) =>
          propsRef.current.onSendMessage?.({ text, replyToId }),
        onEdit: (text, messageId) =>
          propsRef.current.onEditMessage?.({ text, messageId }),
        onCancelMode: type => propsRef.current.onCancelInputAction?.({ type }),
        onTapAttachment: () => propsRef.current.onAttachmentPress?.({}),
        onVoiceRecordingComplete: result =>
          propsRef.current.onVoiceRecordingComplete?.(result),
        onChangeText: text => propsRef.current.onInputTyping?.({ text }),
        onRecordingStateChanged: isRecording =>
          propsRef.current.onRecordingStateChange?.({ isRecording }),
      }),
      [],
    );

    const barRef = useRef<IChatInputBarRef>(null);

    useImperativeHandle(ref, () => ({
      clearInput: () => barRef.current?.clearInput(),
      focus: () => barRef.current?.focus(),
      blur: () => barRef.current?.blur(),
    }));

    const handleHeightChange = useCallback(
      (height: number) => propsRef.current.onHeightChange?.({ height }),
      [],
    );

    return (
      <ChatViewContext.Provider value={contextValue}>
        <View style={style}>
          <ChatInputBar
            ref={barRef}
            mode={mode}
            delegate={delegate}
            onHeightChange={handleHeightChange}
          />
        </View>
      </ChatViewContext.Provider>
    );
  },
);

JsInputBar.displayName = "JsInputBar";
