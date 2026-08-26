import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { LayoutChangeEvent, StyleSheet, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import {
  useInputBarSkin,
  useInputModeController,
  useMicSendAnimation,
  useRecordingController,
  useRecordingGesture,
  useRightButtonAnimation,
} from "../../hooks";
import {
  IInputBarViewDelegate,
  IInputBarViewRef,
  InputBarMode,
} from "../../model";
import { InputRecordingRow } from "../InputRecordingRow";
import { InputReplyPanel } from "../InputReplyPanel";
import { InputBarAttachButton } from "./InputBarAttachButton";
import { InputBarMicButton } from "./InputBarMicButton";
import { InputBarSendButton } from "./InputBarSendButton";
import { InputBarTextField } from "./InputBarTextField";

/**
 * Ядро панели ввода: растущее поле, панель
 * ответа/редактирования, кнопка вложений и морфинг «микрофон ↔ отправка» с
 * жестом записи. Компонент только собирает части: каждое поведение живёт в
 * своём хуке, каждая кнопка — в своём компоненте.
 */

interface IInputBarViewProps {
  mode: InputBarMode;
  delegate: IInputBarViewDelegate;
  onHeightChange: (height: number) => void;
}

export const InputBarView = forwardRef<IInputBarViewRef, IInputBarViewProps>(
  ({ mode, delegate, onHeightChange }, ref) => {
    const { styles } = useInputBarSkin();

    const inputRef = useRef<TextInput>(null);
    const [text, setText] = useState("");

    // Свежие значения для стабильных колбэков — пересоздавать их нельзя:
    // от этого зависят и жест записи, и подписки поля ввода.
    const textRef = useRef(text);
    const modeRef = useRef(mode);
    const delegateRef = useRef(delegate);

    textRef.current = text;
    modeRef.current = mode;
    delegateRef.current = delegate;

    const notifyChangeText = useCallback((value: string) => {
      delegateRef.current.onChangeText(value);
    }, []);

    const handleChangeText = useCallback(
      (value: string) => {
        setText(value);
        notifyChangeText(value);
      },
      [notifyChangeText],
    );

    const hasText = text.trim().length > 0;

    useInputModeController(mode, setText, notifyChangeText, inputRef);

    const {
      recordingState,
      recordDuration,
      rowVisible,
      rowOpacity,
      isRecording,
      isLocked,
      showCancelTrash,
      startRecording,
      finishRecording,
      cancelRecording,
      lockRecording,
      leftButtonScale,
      leftButtonOpacity,
      leftButtonWidth,
    } = useRecordingController(delegateRef);

    const {
      recordGesture,
      micTranslateX,
      micTranslateY,
      micGestureScale,
      slideAlpha,
      lockScale,
      pulseScale,
    } = useRecordingGesture(
      hasText,
      recordingState,
      isLocked,
      startRecording,
      finishRecording,
      cancelRecording,
      lockRecording,
    );

    const { micScale, micAlpha, sendScale, sendAlpha } = useMicSendAnimation(
      !hasText,
      hasText,
    );

    const { micAnimatedStyle: micContainerStyle } = useRightButtonAnimation(
      !hasText || isRecording,
    );

    const recordingStateRef = useRef(recordingState);

    recordingStateRef.current = recordingState;

    const handleSend = useCallback(() => {
      const value = textRef.current.trim();

      if (!value) return;

      const currentMode = modeRef.current;

      switch (currentMode.type) {
        case "normal":
          delegateRef.current.onSend(value, undefined);
          break;
        case "reply":
          delegateRef.current.onSend(value, currentMode.messageId);
          break;
        case "edit":
          delegateRef.current.onEdit(value, currentMode.messageId);
          break;
      }
      setText("");
      delegateRef.current.onChangeText("");
      if (currentMode.type !== "normal") {
        delegateRef.current.onCancelMode("none");
      }
    }, []);

    const handleLockedSend = useCallback(() => {
      if (recordingStateRef.current !== "locked") return;
      finishRecording();
    }, [finishRecording]);

    const handleAttachTap = useCallback(() => {
      if (recordingStateRef.current === "locked") {
        cancelRecording();

        return;
      }
      if (recordingStateRef.current === "idle") {
        delegateRef.current.onTapAttachment();
      }
    }, [cancelRecording]);

    const handleCloseMode = useCallback(() => {
      const type = modeRef.current.type === "edit" ? "edit" : "reply";

      if (modeRef.current.type === "edit") {
        setText("");
        delegateRef.current.onChangeText("");
      }
      inputRef.current?.blur();
      delegateRef.current.onCancelMode(type);
    }, []);

    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => onHeightChange(e.nativeEvent.layout.height),
      [onHeightChange],
    );

    useImperativeHandle(
      ref,
      () => ({
        clearInput() {
          setText("");
          delegateRef.current.onChangeText("");
        },
        focus() {
          inputRef.current?.focus();
        },
        blur() {
          inputRef.current?.blur();
        },
      }),
      [],
    );

    // Строка гаснет отдельно от смены состояния.
    const recordingRowStyle = useAnimatedStyle(() => ({
      opacity: rowOpacity.value,
    }));

    return (
      <View style={ss.bar} onLayout={handleLayout}>
        <View style={styles.stack}>
          <InputBarAttachButton
            showTrash={isLocked || showCancelTrash}
            scale={leftButtonScale}
            opacity={leftButtonOpacity}
            width={leftButtonWidth}
            onPress={handleAttachTap}
          />

          <View style={styles.field}>
            <InputReplyPanel mode={mode} onClose={handleCloseMode} />

            <InputBarTextField
              inputRef={inputRef}
              value={text}
              // Поле возвращается не в момент остановки записи, а когда
              // строка записи полностью ушла.
              hidden={rowVisible}
              onChangeText={handleChangeText}
            />

            {rowVisible && (
              <Animated.View
                pointerEvents={isRecording ? "box-none" : "none"}
                style={[ss.recordingRow, recordingRowStyle]}
              >
                <InputRecordingRow
                  duration={recordDuration}
                  slideAlpha={slideAlpha}
                  slideHidden={isLocked}
                  onCancelTap={cancelRecording}
                />
              </Animated.View>
            )}

            {!isRecording && (
              <InputBarSendButton
                enabled={hasText}
                scale={sendScale}
                alpha={sendAlpha}
                onPress={handleSend}
              />
            )}
          </View>

          <InputBarMicButton
            gesture={recordGesture}
            isRecording={isRecording}
            isLocked={isLocked}
            translateX={micTranslateX}
            translateY={micTranslateY}
            gestureScale={micGestureScale}
            pulseScale={pulseScale}
            micScale={micScale}
            micAlpha={micAlpha}
            lockScale={lockScale}
            containerStyle={micContainerStyle}
            onPress={handleLockedSend}
          />
        </View>
      </View>
    );
  },
);

InputBarView.displayName = "InputBarView";

const ss = StyleSheet.create({
  bar: { backgroundColor: "transparent" },
  recordingRow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});
