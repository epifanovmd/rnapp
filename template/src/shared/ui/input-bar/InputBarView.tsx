import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { InputIcon } from "./components/InputIcon";
import { InputLockBadge } from "./components/InputLockBadge";
import { InputRecordingRow } from "./components/InputRecordingRow";
import { InputReplyPanel } from "./components/InputReplyPanel";
import {
  useInputModeController,
  useMicSendAnimation,
  useRecordingController,
  useRecordingGesture,
  useRightButtonAnimation,
} from "./hooks";
import { useInputBarContext } from "./model/input-bar-context";
import {
  IInputBarViewDelegate,
  IInputBarViewRef,
} from "./model/input-bar-delegate";
import { InputBarMode } from "./model/input-bar-types";
import { inputTextBase } from "./model/text-style";

export type { IInputBarViewDelegate, IInputBarViewRef };

// ─── Типы ─────────────────────────────────────────────────────────────────

interface IInputBarViewProps {
  mode: InputBarMode;
  delegate: IInputBarViewDelegate;
  onHeightChange: (height: number) => void;
}

// ─── Компонент ─────────────────────────────────────────────────────────────

export const InputBarView = memo(
  forwardRef<IInputBarViewRef, IInputBarViewProps>(
    ({ mode, delegate, onHeightChange }, ref) => {
      const { theme, layout, features } = useInputBarContext();

      const inputRef = useRef<TextInput>(null);
      const [text, setText] = useState("");
      const [contentHeight, setContentHeight] = useState(0);

      const textRef = useRef(text);

      textRef.current = text;

      const modeRef = useRef(mode);

      modeRef.current = mode;

      const delegateRef = useRef(delegate);

      delegateRef.current = delegate;

      const onChangeText = useCallback((value: string) => {
        delegateRef.current.onChangeText(value);
      }, []);

      const handleChangeText = useCallback((value: string) => {
        setText(value);
        delegateRef.current.onChangeText(value);
      }, []);

      const hasText = text.trim().length > 0;

      // ─── Хуки ─────────────────────────────────────────────────────────────
      // SOLID: каждый хук — одна ответственность.

      useInputModeController(mode, setText, onChangeText, inputRef);

      // Recording state machine + voice recorder + left button animation.
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

      // Pan gesture + mic drag animation.
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

      // Mic↔send button crossfade.
      const voiceEnabled = features.showVoiceRecording;
      const showMic = voiceEnabled && !hasText;
      const showInternalSend = !voiceEnabled || hasText;

      const { micScale, micAlpha, sendScale, sendAlpha } = useMicSendAnimation(
        showMic,
        showInternalSend,
      );

      // Правая кнопка: плавное расширение бара вправо.
      const micVisible = !hasText || isRecording;
      const { micAnimatedStyle: rightButtonStyle } =
        useRightButtonAnimation(micVisible);

      const recordingStateRef = useRef(recordingState);

      recordingStateRef.current = recordingState;

      // ─── Отправка ─────────────────────────────────────────────────────────

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

      const handleLeftTap = useCallback(() => {
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

      // ─── Стили ────────────────────────────────────────────────────────────

      const inputHeight = Math.min(
        Math.max(contentHeight, layout.textViewMinHeight),
        layout.textViewMaxHeight,
      );

      // Порт recordingRow.fadeOut: строка гаснет отдельно от смены состояния.
      const recordingRowStyle = useAnimatedStyle(() => ({
        opacity: rowOpacity.value,
      }));

      const micButtonStyle = useAnimatedStyle(() => ({
        opacity: micAlpha.value,
        transform: [
          { translateX: micTranslateX.value },
          { translateY: micTranslateY.value },
          { scale: micScale.value * micGestureScale.value * pulseScale.value },
        ],
      }));

      const sendButtonStyle = useAnimatedStyle(() => ({
        opacity: sendAlpha.value,
        transform: [{ scale: sendScale.value }],
      }));

      const buttonBase = useMemo(
        () => ({
          width: layout.inputButtonSize,
          height: layout.inputButtonSize,
          borderRadius: layout.inputButtonSize / 2,
          borderWidth: layout.inputBorderWidth,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          alignItems: "center" as const,
          justifyContent: "center" as const,
        }),
        [layout, theme],
      );

      const showAttach = features.showAttachButton;
      const showTrash = isLocked || showCancelTrash;
      const leftIcon = showTrash
        ? ("trash.fill" as const)
        : ("paperclip" as const);
      const leftColor = showTrash
        ? theme.inputRecordingCancel
        : theme.inputTint;
      const micIcon = isLocked ? ("arrow.up" as const) : ("mic.fill" as const);

      // Порт левой кнопки: всегда в DOM, анимируется width+scale+opacity.
      const leftButtonAnimatedStyle = useAnimatedStyle(() => ({
        opacity: leftButtonOpacity.value,
        width: leftButtonWidth.value * layout.inputButtonSize,
        transform: [{ scale: leftButtonScale.value }],
      }));

      const micActive = isRecording;
      const internalSendSize =
        layout.textViewMinHeight - layout.inputSendButtonInset * 2;

      // ─── JSX ──────────────────────────────────────────────────────────────

      return (
        <View style={ss.bar} onLayout={handleLayout}>
          <View
            style={[
              ss.stack,
              {
                paddingHorizontal: layout.inputBarHPad,
                paddingVertical: layout.inputBarVPad,
                gap: layout.inputStackSpacing,
              },
            ]}
          >
            {showAttach && (
              <Animated.View style={leftButtonAnimatedStyle}>
                <Pressable style={buttonBase} onPress={handleLeftTap}>
                  <InputIcon
                    name={leftIcon}
                    size={layout.inputIconSize}
                    color={leftColor}
                  />
                </Pressable>
              </Animated.View>
            )}

            <View
              style={[
                ss.mainContainer,
                {
                  borderRadius: layout.textViewCornerRadius,
                  borderWidth: layout.inputBorderWidth,
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBackground,
                },
              ]}
            >
              <InputReplyPanel mode={mode} onClose={handleCloseMode} />

              {/* TextInput всегда в DOM — иначе при начале записи он
                  размонтируется, фокус уходит и клавиатура закрывается.
                  Во время записи накрыт InputRecordingRow (position: absolute),
                  но ни один пропс TextInput не меняется — иначе RN может
                  пересоздать нативный UITextView и клавиатура уйдёт. */}
              <TextInput
                ref={inputRef}
                multiline
                value={text}
                placeholder={layout.inputPlaceholderText}
                placeholderTextColor={theme.inputPlaceholder}
                style={[
                  inputTextBase,
                  ss.textInput,
                  {
                    height: inputHeight,
                    paddingTop: layout.textViewInsetTop,
                    paddingBottom: layout.textViewInsetBottom,
                    paddingLeft: layout.textViewInsetLeft + 5,
                    paddingRight: layout.textViewInsetRight,
                    fontSize: layout.textViewFont.fontSize,
                    color: theme.inputText,
                    // Поле возвращается не в момент остановки записи, а когда
                    // строка записи полностью ушла — как в поде.
                    opacity: rowVisible ? 0 : 1,
                  },
                ]}
                selectionColor={theme.inputTint}
                onChangeText={handleChangeText}
                onContentSizeChange={e =>
                  setContentHeight(e.nativeEvent.contentSize.height)
                }
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
                <Animated.View
                  pointerEvents={showInternalSend ? "auto" : "none"}
                  style={[
                    ss.internalSend,
                    {
                      right: layout.inputSendButtonInset,
                      bottom: layout.inputSendButtonInset,
                    },
                    sendButtonStyle,
                  ]}
                >
                  <Pressable
                    style={[
                      ss.sendButton,
                      {
                        width: internalSendSize,
                        height: internalSendSize,
                        borderRadius: internalSendSize / 2,
                        backgroundColor: theme.inputRecordingMicFill,
                      },
                    ]}
                    onPress={handleSend}
                  >
                    <InputIcon
                      name="arrow.up"
                      size={layout.inputSendButtonIconSize}
                      color="#FFFFFF"
                      strokeWidth={2.6}
                    />
                  </Pressable>
                </Animated.View>
              )}
            </View>

            {voiceEnabled && (
              <View>
                <InputLockBadge
                  visible={isRecording && !isLocked}
                  scale={lockScale}
                />
                <GestureDetector gesture={recordGesture}>
                  <Animated.View style={[micButtonStyle, rightButtonStyle]}>
                    <Pressable
                      style={[
                        buttonBase,
                        micActive && [
                          ss.micActive,
                          { backgroundColor: theme.inputRecordingMicFill },
                        ],
                      ]}
                      disabled={!isLocked}
                      onPress={handleLockedSend}
                    >
                      <InputIcon
                        name={micIcon}
                        size={layout.inputIconSize}
                        color={micActive ? "#FFFFFF" : theme.inputTint}
                        strokeWidth={micIcon === "arrow.up" ? 2.6 : 2}
                      />
                    </Pressable>
                  </Animated.View>
                </GestureDetector>
              </View>
            )}
          </View>
        </View>
      );
    },
  ),
);

InputBarView.displayName = "InputBarView";

// ─── Стили ──────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  bar: { backgroundColor: "transparent", paddingVertical: 0 },
  textInput: { textAlignVertical: "center" },
  sendButton: { alignItems: "center", justifyContent: "center" },
  micActive: { borderWidth: 0 },
  stack: { flexDirection: "row", alignItems: "flex-end" },
  mainContainer: { flex: 1, overflow: "visible" },
  internalSend: { position: "absolute" },
  recordingRow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  hiddenButton: { display: "none" },
});
