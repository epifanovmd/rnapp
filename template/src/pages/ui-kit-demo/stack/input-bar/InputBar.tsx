import { useKeyboardInset } from "@shared/lib/hooks/use-keyboard-inset";
import { useKeyboardScrollCompensation } from "@shared/lib/hooks/use-keyboard-scroll-compensation";
import { StackProps } from "@shared/lib/navigation";
import { useTheme } from "@shared/lib/theme";
import {
  Col,
  Container,
  Content,
  Row,
  ScrollView,
  Switch,
  Text,
} from "@shared/ui";
import {
  InputBar,
  InputBarInputAction,
  KeyboardInputBar,
} from "@shared/ui/input-bar";
import { JsInputBar } from "@shared/ui/input-bar/JsInputBar";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useMemo, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type EventEntry = { time: string; text: string };

const now = () => {
  const d = new Date();

  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

export const InputBarPage: FC<StackProps> = observer(() => {
  const { isDark } = useTheme();
  const safeArea = useSafeAreaInsets();

  const [useNative, setUseNative] = useState(Platform.OS === "ios");
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [inputAction, setInputAction] = useState<InputBarInputAction | null>(
    null,
  );
  const [editingText, setEditingText] = useState("Исходный текст");

  const log = useCallback((text: string) => {
    setEvents(prev => [{ time: now(), text }, ...prev].slice(0, 50));
  }, []);

  const Bar = useNative ? InputBar : JsInputBar;
  const theme = isDark ? "dark" : "light";

  // ─── Компенсация скролла ───────────────────────────────────────────────

  const { bottomInset } = useKeyboardInset();
  // Демо-страница не отслеживает реальную высоту инпут-бара —
  // используем фиксированное значение компактного состояния.
  const inputBarHeightSV = useSharedValue(52);

  const {
    listShift,
    listExtension: _hookExtension,
    onContainerLayout,
    onContentSizeChange,
    setFooterPadding,
  } = useKeyboardScrollCompensation(bottomInset, inputBarHeightSV);

  const listExtension = safeArea.bottom + 52; // 52 = inputBarMinHeight

  const listWrapStyle = useMemo(
    () => ({ bottom: -listExtension }),
    [listExtension],
  );

  const listShiftStyle = useMemo(
    () =>
      ({
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
      }) as const,
    [],
  );

  const listAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -listShift.value }],
  }));

  // Сообщаем хуку footer padding при изменении extension.
  React.useEffect(() => {
    setFooterPadding(listExtension);
  }, [listExtension, setFooterPadding]);

  // ─── Режимы ────────────────────────────────────────────────────────────

  const setNormal = () => {
    setInputAction(null);
    log("Режим: обычный");
  };
  const setReply = () =>
    setInputAction({
      type: "reply",
      messageId: "msg-1",
      senderName: "Иван Петров",
      text: "Привет, как дела? Давно не виделись!",
      hasImage: false,
    });
  const setReplyWithImage = () =>
    setInputAction({
      type: "reply",
      messageId: "msg-2",
      senderName: "Мария",
      hasImage: true,
    });
  const setEdit = () =>
    setInputAction({
      type: "edit",
      messageId: "msg-3",
      text: editingText,
    });

  return (
    <Container edges={["top"]}>
      <Animated.View
        style={[listShiftStyle, listWrapStyle, listAnimatedStyle]}
        onLayout={e => onContainerLayout(e.nativeEvent.layout.height)}
      >
        <ScrollView
          style={ss.scroll}
          contentContainerStyle={ss.scrollContent}
          onContentSizeChange={onContentSizeChange}
        >
          <Content>
            <Row mt={8} alignItems={"center"} justifyContent={"space-between"}>
              <Col flexShrink={1} pr={12}>
                <Text textStyle={"Body_M1"}>
                  {useNative
                    ? "Нативная реализация (RNInputBar)"
                    : "JS-реализация (InputBarView)"}
                </Text>
                <Text textStyle={"Caption_M2"} color={"textSecondary"}>
                  {Platform.OS === "ios"
                    ? useNative
                      ? "Сейчас: нативная (iOS)"
                      : "Сейчас: JS-порт"
                    : "Сейчас: JS-порт"}
                </Text>
              </Col>
              {Platform.OS === "ios" && (
                <Switch
                  isActive={useNative}
                  onChange={v => {
                    setUseNative(v);
                    log(v ? "Переключено на нативную" : "Переключено на JS");
                  }}
                />
              )}
            </Row>

            {/* Режимы */}
            <Text textStyle={"Title_S1"} mt={16}>
              {"Режимы"}
            </Text>
            <Row mt={8} gap={8} flexWrap={"wrap"}>
              <Text textStyle={"Body_M1"} color={"primary"} onPress={setNormal}>
                {"Обычный"}
              </Text>
              <Text textStyle={"Body_M1"} color={"primary"} onPress={setReply}>
                {"Ответ"}
              </Text>
              <Text
                textStyle={"Body_M1"}
                color={"primary"}
                onPress={setReplyWithImage}
              >
                {"Ответ (фото)"}
              </Text>
              <Text textStyle={"Body_M1"} color={"primary"} onPress={setEdit}>
                {"Редактирование"}
              </Text>
            </Row>
            {inputAction?.type === "edit" && (
              <Row mt={8} alignItems={"center"} gap={8}>
                <Text textStyle={"Body_M2"}>{"Текст:"}</Text>
                <Text
                  textStyle={"Body_M1"}
                  color={"primary"}
                  onPress={() => {
                    const next = editingText + " (изм.)";

                    setEditingText(next);
                    setInputAction({
                      type: "edit",
                      messageId: "msg-3",
                      text: next,
                    });
                  }}
                >
                  {"изменить"}
                </Text>
              </Row>
            )}

            {/* События */}
            <Text textStyle={"Title_S1"} mt={16}>
              {"События"}
            </Text>
            <Text
              textStyle={"Body_M1"}
              color={"primary"}
              mt={4}
              onPress={() => {
                setEvents([]);
              }}
            >
              {"Очистить"}
            </Text>
            <Content mt={8}>
              {events.length === 0 && (
                <Text textStyle={"Body_M2"} color={"textSecondary"}>
                  {"Событий пока нет"}
                </Text>
              )}
              {events.map((e, i) => (
                <Row key={i} gap={8}>
                  <Text textStyle={"Caption_M2"} color={"textSecondary"}>
                    {e.time}
                  </Text>
                  <Text textStyle={"Caption_M2"}>{e.text}</Text>
                </Row>
              ))}
            </Content>
          </Content>
        </ScrollView>
      </Animated.View>

      <KeyboardInputBar bottomInset={bottomInset}>
        <Bar
          theme={theme}
          inputAction={inputAction}
          onSendMessage={({ text, replyToId }) => {
            log(
              `onSendMessage · text="${text}"${replyToId ? ` · replyTo=${replyToId}` : ""}`,
            );
            setInputAction(null);
          }}
          onEditMessage={({ text, messageId }) => {
            log(`onEditMessage · text="${text}" · msg=${messageId}`);
            setEditingText(text);
            setInputAction(null);
          }}
          onCancelInputAction={({ type }) => {
            log(`onCancelInputAction · type=${type}`);
            setInputAction(null);
          }}
          onAttachmentPress={() => log("onAttachmentPress")}
          onVoiceRecordingComplete={result =>
            log(
              `onVoiceRecordingComplete · duration=${result.duration.toFixed(1)}s · samples=${result.waveform?.length ?? 0}`,
            )
          }
          onInputTyping={({ text }) => {
            // Слишком часто
          }}
          onHeightChange={({ height }) => {
            inputBarHeightSV.value = height;
          }}
        />
      </KeyboardInputBar>
    </Container>
  );
});

InputBarPage.displayName = "InputBarPage";

const ss = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 104 }, // 52 (inputBar) + 52 (safeArea) ≈ padding
});
