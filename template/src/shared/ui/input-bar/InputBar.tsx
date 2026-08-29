import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { View } from "react-native";

import { InputBarView } from "./components";
import { IInputBarViewDelegate, IInputBarViewRef, InputBarMode } from "./model";
import { IInputBarRef, InputBarProps } from "./types";

/**
 * Панель ввода: текст, вложения, ответ/редактирование и запись голосового.
 */
export const InputBar = forwardRef<IInputBarRef, InputBarProps>(
  (props, ref) => {
    const { inputAction, style } = props;

    const propsRef = useRef(props);

    propsRef.current = props;

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
          propsRef.current.onSendMessage?.(text, replyToId),
        onEdit: (text, messageId) =>
          propsRef.current.onEditMessage?.(text, messageId),
        onCancelMode: type => propsRef.current.onCancelInputAction?.(type),
        onTapAttachment: () => propsRef.current.onAttachmentPress?.(),
        onVoiceRecordingComplete: recording =>
          propsRef.current.onVoiceRecordingComplete?.(recording),
        onChangeText: text => propsRef.current.onInputTyping?.(text),
        onRecordingStateChanged: isRecording =>
          propsRef.current.onRecordingStateChange?.(isRecording),
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
      (height: number) => propsRef.current.onHeightChange?.(height),
      [],
    );

    return (
      <View style={style}>
        <InputBarView
          ref={barRef}
          mode={mode}
          delegate={delegate}
          onHeightChange={handleHeightChange}
        />
      </View>
    );
  },
);

InputBar.displayName = "InputBar";
