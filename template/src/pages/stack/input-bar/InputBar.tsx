import {
  useKeyboardInset,
  useKeyboardScrollCompensation,
} from "@shared/lib/keyboard";
import { useTheme } from "@shared/lib/theme";
import { Container, Content, KeyboardScrollView, Row, Text } from "@shared/ui";
import {
  INPUT_BAR_MIN_HEIGHT,
  InputBar,
  InputBarInputAction,
  KeyboardInputBar,
} from "@shared/ui/input-bar";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useState } from "react";
import { Keyboard, Pressable, StyleSheet } from "react-native";
import { useSharedValue } from "react-native-reanimated";

type EventEntry = { time: string; text: string };

const now = () => {
  const d = new Date();

  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

export const InputBarPage: FC = observer(() => {
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [inputAction, setInputAction] = useState<InputBarInputAction | null>(
    null,
  );
  const [editingText, setEditingText] = useState("Исходный текст");

  const log = useCallback((text: string) => {
    setEvents(prev => [{ time: now(), text }, ...prev].slice(0, 50));
  }, []);

  // ─── Компенсация клавиатуры ────────────────────────────────────────────
  // Инсеты и панель — `useKeyboardInset`, скролл — отдельный
  // `useKeyboardScrollCompensation`. Подписка на клавиатуру одна.

  const barHeight = useSharedValue(INPUT_BAR_MIN_HEIGHT);

  const kb = useKeyboardInset({ barHeight });
  const compensation = useKeyboardScrollCompensation(
    kb.contentInset,
    kb.reservedInset,
  );

  const handleHeightChange = useCallback(
    (height: number) => {
      barHeight.value = height;
    },
    [barHeight],
  );

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
    // Верхний safe area уже съел хедер (AppHeader с safeArea), нижний —
    // распорка в конце контента; экрану добирать нечего.
    <Container edges={[]}>
      <KeyboardScrollView
        style={ss.scroll}
        scroll={compensation}
        keyboardShouldPersistTaps={"handled"}
      >
        {/* Тап по контенту снимает фокус с поля ввода. */}
        <Pressable onPress={Keyboard.dismiss}>
          <Content>
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
        </Pressable>
      </KeyboardScrollView>

      <KeyboardInputBar offset={kb.occludedBottom}>
        <InputBar
          inputAction={inputAction}
          onSendMessage={(text, replyToId) => {
            log(
              `onSendMessage · text="${text}"${replyToId ? ` · replyTo=${replyToId}` : ""}`,
            );
            setInputAction(null);
          }}
          onEditMessage={(text, messageId) => {
            log(`onEditMessage · text="${text}" · msg=${messageId}`);
            setEditingText(text);
            setInputAction(null);
          }}
          onCancelInputAction={type => {
            log(`onCancelInputAction · type=${type}`);
            setInputAction(null);
          }}
          onAttachmentPress={() => log("onAttachmentPress")}
          onVoiceRecordingComplete={result =>
            log(
              `onVoiceRecordingComplete · duration=${result.duration.toFixed(1)}s · samples=${result.waveform?.length ?? 0}`,
            )
          }
          onInputTyping={() => {
            // Слишком часто
          }}
          onHeightChange={handleHeightChange}
        />
      </KeyboardInputBar>
    </Container>
  );
});

InputBarPage.displayName = "InputBarPage";

const ss = StyleSheet.create({
  scroll: { flex: 1 },
});
