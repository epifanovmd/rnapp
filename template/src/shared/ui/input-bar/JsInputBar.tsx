import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { View } from "react-native";

import { InputBarView } from "./components";
import {
  createInputBarStyles,
  INPUT_BAR_DEFAULT_FEATURES,
  INPUT_BAR_DEFAULT_LAYOUT,
  InputBarContext,
  resolveInputBarTheme,
} from "./config";
import { IInputBarViewDelegate, IInputBarViewRef, InputBarMode } from "./model";
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

    const resolvedTheme = useMemo(() => resolveInputBarTheme(theme), [theme]);
    const layout = useMemo(() => {
      if (!placeholder) return INPUT_BAR_DEFAULT_LAYOUT;

      return {
        ...INPUT_BAR_DEFAULT_LAYOUT,
        inputPlaceholderText: placeholder,
      };
    }, [placeholder]);

    const contextValue = useMemo(
      () => ({
        theme: resolvedTheme,
        layout,
        features: INPUT_BAR_DEFAULT_FEATURES,
        styles: createInputBarStyles(resolvedTheme, layout),
      }),
      [resolvedTheme, layout],
    );

    const mode: InputBarMode = useMemo(() => {
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

    const delegate: IInputBarViewDelegate = useMemo(
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

    const barRef = useRef<IInputBarViewRef>(null);

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
      <InputBarContext.Provider value={contextValue}>
        <View style={style}>
          <InputBarView
            ref={barRef}
            mode={mode}
            delegate={delegate}
            onHeightChange={handleHeightChange}
          />
        </View>
      </InputBarContext.Provider>
    );
  },
);

JsInputBar.displayName = "JsInputBar";
