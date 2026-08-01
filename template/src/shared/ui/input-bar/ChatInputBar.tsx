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
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useChatViewContext } from "../chat-view/components/chat-view-context";
import { ChatIcon, ChatIconName } from "../chat-view/components/ChatIcon";
import {
  chatTextBase,
  ChatVoiceRecorder,
  createChatVoiceRecorder,
  IChatVoiceRecorderResult,
} from "../chat-view/model";
import { ChatInputMode, ChatRecordingState } from "./input-bar-types";
import { InputLockBadge } from "./InputLockBadge";
import { InputRecordingRow } from "./InputRecordingRow";
import { InputReplyPanel } from "./InputReplyPanel";

/**
 * Порт InputBarView (+Recording): текст с авто-высотой, панель ответа/
 * редактирования, кнопка вложений, внутренняя кнопка отправки, запись голоса
 * (long-press по микрофону, свайп влево — отмена, вверх — блокировка).
 */

export interface IChatInputBarDelegate {
  onSend(text: string, replyToId: string | undefined): void;
  onEdit(text: string, messageId: string): void;
  onCancelMode(type: "reply" | "edit" | "none"): void;
  onTapAttachment(): void;
  onVoiceRecordingComplete(result: IChatVoiceRecorderResult): void;
  onVoiceRecordingCancelled?(): void;
  onChangeText(text: string): void;
  onRecordingStateChanged(isRecording: boolean): void;
}

/** Императивный API ядра (порт clearInput/activateKeyboard/dismissKeyboard). */
export interface IChatInputBarRef {
  clearInput(): void;
  focus(): void;
  blur(): void;
}

interface IChatInputBarProps {
  mode: ChatInputMode;
  delegate: IChatInputBarDelegate;
  onHeightChange: (height: number) => void;
}

export const ChatInputBar = memo(
  forwardRef<IChatInputBarRef, IChatInputBarProps>(
    ({ mode, delegate, onHeightChange }, ref) => {
      const { theme, layout, features } = useChatViewContext();

      const inputRef = useRef<TextInput>(null);
      const [text, setText] = useState("");
      const [contentHeight, setContentHeight] = useState(0);
      const [recordingState, setRecordingState] =
        useState<ChatRecordingState>("idle");
      const [recordDuration, setRecordDuration] = useState(0);

      const textRef = useRef(text);

      textRef.current = text;

      const recordingStateRef = useRef(recordingState);

      recordingStateRef.current = recordingState;

      const modeRef = useRef(mode);

      modeRef.current = mode;

      const delegateRef = useRef(delegate);

      delegateRef.current = delegate;

      const hasText = text.trim().length > 0;
      const isRecording = recordingState !== "idle";
      const isLocked = recordingState === "locked";

      // ─── Рекордер ──────────────────────────────────────────────────────────

      const recorderRef = useRef<ChatVoiceRecorder | null>(null);

      if (!recorderRef.current) {
        recorderRef.current = createChatVoiceRecorder();
      }

      useEffect(() => {
        const recorder = recorderRef.current!;

        recorder.delegate = {
          onUpdateDuration: setRecordDuration,
          onStop: result =>
            delegateRef.current.onVoiceRecordingComplete(result),
        };

        return () => {
          recorder.cancelRecording();
        };
      }, []);

      // ─── Режим reply/edit ──────────────────────────────────────────────────

      const prevModeType = useRef<ChatInputMode["type"]>("normal");

      useEffect(() => {
        if (mode.type === "edit") {
          setText(mode.text);
          delegateRef.current.onChangeText(mode.text);
          inputRef.current?.focus();
        } else if (mode.type === "reply") {
          inputRef.current?.focus();
        } else if (prevModeType.current === "edit") {
          setText("");
          delegateRef.current.onChangeText("");
        }
        prevModeType.current = mode.type;
      }, [mode]);

      // ─── Анимации кнопок mic/send ──────────────────────────────────────────

      const voiceEnabled = features.showVoiceRecording;
      const showMic = voiceEnabled && !hasText;
      const showInternalSend = !voiceEnabled || hasText;

      const micScale = useSharedValue(showMic ? 1 : 0.01);
      const micAlpha = useSharedValue(showMic ? 1 : 0);
      const sendScale = useSharedValue(showInternalSend ? 1 : 0.01);
      const sendAlpha = useSharedValue(showInternalSend ? 1 : 0);

      useEffect(() => {
        if (showMic) {
          micScale.value = withDelay(
            50,
            withSpring(1, { duration: 250, dampingRatio: 0.65 }),
          );
          micAlpha.value = withDelay(50, withTiming(1, { duration: 250 }));
        } else {
          micScale.value = withTiming(0.01, {
            duration: 250,
            easing: Easing.out(Easing.ease),
          });
          micAlpha.value = withTiming(0, { duration: 250 });
        }
      }, [showMic, micScale, micAlpha]);

      useEffect(() => {
        if (showInternalSend) {
          sendScale.value = withDelay(
            50,
            withSpring(1, { duration: 250, dampingRatio: 0.7 }),
          );
          sendAlpha.value = withDelay(50, withTiming(1, { duration: 250 }));
        } else {
          sendScale.value = withTiming(0.01, { duration: 150 });
          sendAlpha.value = withTiming(0, { duration: 150 });
        }
      }, [showInternalSend, sendScale, sendAlpha]);

      // ─── Жест записи ───────────────────────────────────────────────────────

      const micTranslateX = useSharedValue(0);
      const micTranslateY = useSharedValue(0);
      const micGestureScale = useSharedValue(1);
      const slideAlpha = useSharedValue(1);
      const lockScale = useSharedValue(1);
      const pulseScale = useSharedValue(1);

      const resetGestureValues = useCallback(() => {
        micTranslateX.value = withSpring(0, {
          duration: 200,
          dampingRatio: 0.7,
        });
        micTranslateY.value = withSpring(0, {
          duration: 200,
          dampingRatio: 0.7,
        });
        micGestureScale.value = withSpring(1, {
          duration: 200,
          dampingRatio: 0.7,
        });
        slideAlpha.value = 1;
        lockScale.value = 1;
      }, [
        micTranslateX,
        micTranslateY,
        micGestureScale,
        slideAlpha,
        lockScale,
      ]);

      const startRecording = useCallback(() => {
        setRecordingState("recording");
        setRecordDuration(0);
        recorderRef.current?.startRecording();
        delegateRef.current.onRecordingStateChanged(true);
      }, []);

      const finishRecording = useCallback(() => {
        setRecordingState("idle");
        resetGestureValues();
        pulseScale.value = 1;
        recorderRef.current?.stopRecording();
        delegateRef.current.onRecordingStateChanged(false);
      }, [resetGestureValues, pulseScale]);

      const cancelRecording = useCallback(() => {
        setRecordingState("idle");
        resetGestureValues();
        pulseScale.value = 1;
        recorderRef.current?.cancelRecording();
        delegateRef.current.onVoiceRecordingCancelled?.();
        delegateRef.current.onRecordingStateChanged(false);
      }, [resetGestureValues, pulseScale]);

      const lockRecording = useCallback(() => {
        setRecordingState("locked");
        resetGestureValues();
        pulseScale.value = withRepeat(
          withTiming(layout.recordPulseMaxScale / layout.recordPulseBaseScale, {
            duration: layout.recordPulseDuration * 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true,
        );
      }, [resetGestureValues, pulseScale, layout]);

      const handleDrag = useCallback(
        (dx: number, dy: number) => {
          if (recordingStateRef.current !== "recording") return;

          if (Math.abs(dx) > Math.abs(dy) && dx < 0) {
            const progress = Math.min(
              1,
              Math.abs(dx) / layout.recordCancelThreshold,
            );

            micTranslateX.value = Math.min(0, dx) * 0.8;
            micTranslateY.value = 0;
            micGestureScale.value = 1 - progress * 0.3;
            slideAlpha.value = 1 - progress;
            if (progress >= 1) cancelRecording();
          } else if (dy < 0) {
            const progress = Math.min(
              1,
              Math.abs(dy) / layout.recordLockThreshold,
            );

            micTranslateX.value = 0;
            micTranslateY.value = Math.min(0, dy) * 0.8;
            lockScale.value = 1 + progress * 0.2;
            if (progress >= 1) lockRecording();
          } else {
            micTranslateX.value = 0;
            micTranslateY.value = 0;
            micGestureScale.value = 1;
            slideAlpha.value = 1;
            lockScale.value = 1;
          }
        },
        [
          layout,
          micTranslateX,
          micTranslateY,
          micGestureScale,
          slideAlpha,
          lockScale,
          cancelRecording,
          lockRecording,
        ],
      );

      const handleRelease = useCallback(() => {
        if (recordingStateRef.current !== "recording") return;
        finishRecording();
      }, [finishRecording]);

      const recordGesture = usePanGesture({
        enabled: voiceEnabled && !hasText && !isLocked,
        disableReanimated: true,
        activateAfterLongPress: layout.recordMinPressDuration * 1000,
        onActivate: () => startRecording(),
        onUpdate: e => handleDrag(e.translationX, e.translationY),
        onDeactivate: () => handleRelease(),
      });

      // ─── Отправка ──────────────────────────────────────────────────────────

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

      const handleChangeText = useCallback((value: string) => {
        setText(value);
        delegateRef.current.onChangeText(value);
      }, []);

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

      // ─── Стили ─────────────────────────────────────────────────────────────

      const inputHeight = Math.min(
        Math.max(contentHeight, layout.textViewMinHeight),
        layout.textViewMaxHeight,
      );

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
      const leftHidden = !showAttach || (isRecording && !isLocked);

      let leftIcon: ChatIconName = "paperclip";
      let leftColor = theme.inputTint;

      if (isLocked) {
        leftIcon = "trash.fill";
        leftColor = theme.inputRecordingCancel;
      }

      const micIcon: ChatIconName = isLocked ? "arrow.up" : "mic.fill";
      const micActive = isRecording;
      const internalSendSize =
        layout.textViewMinHeight - layout.inputSendButtonInset * 2;

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
            {!leftHidden && (
              <Pressable style={buttonBase} onPress={handleLeftTap}>
                <ChatIcon
                  name={leftIcon}
                  size={layout.inputIconSize}
                  color={leftColor}
                />
              </Pressable>
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

              {isRecording ? (
                <InputRecordingRow
                  duration={recordDuration}
                  slideAlpha={slideAlpha}
                  slideHidden={isLocked}
                  onCancelTap={cancelRecording}
                />
              ) : (
                <TextInput
                  ref={inputRef}
                  multiline
                  value={text}
                  placeholder={layout.inputPlaceholderText}
                  placeholderTextColor={theme.inputPlaceholder}
                  style={[
                    chatTextBase,
                    ss.textInput,
                    {
                      height: inputHeight,
                      paddingTop: layout.textViewInsetTop,
                      paddingBottom: layout.textViewInsetBottom,
                      paddingLeft: layout.textViewInsetLeft + 5,
                      paddingRight: layout.textViewInsetRight,
                      fontSize: layout.textViewFont.fontSize,
                      color: theme.inputText,
                    },
                  ]}
                  selectionColor={theme.inputTint}
                  onChangeText={handleChangeText}
                  onContentSizeChange={e =>
                    setContentHeight(e.nativeEvent.contentSize.height)
                  }
                />
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
                    <ChatIcon
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
                  <Animated.View
                    style={[
                      !hasText || isLocked ? null : ss.hiddenButton,
                      micButtonStyle,
                    ]}
                  >
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
                      <ChatIcon
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

ChatInputBar.displayName = "ChatInputBar";

const ss = StyleSheet.create({
  bar: {
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
  textInput: {
    textAlignVertical: "center",
  },
  sendButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  micActive: {
    borderWidth: 0,
  },
  stack: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  mainContainer: {
    flex: 1,
    overflow: "visible",
  },
  internalSend: {
    position: "absolute",
  },
  hiddenButton: {
    display: "none",
  },
});
