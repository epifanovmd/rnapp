import {
  useKeyboardInset,
  useKeyboardScrollCompensation,
} from "@shared/lib/keyboard";
import { StackProps } from "@shared/lib/navigation";
import { useTheme } from "@shared/lib/theme";
import {
  Col,
  Container,
  Content,
  KeyboardScrollView,
  Row,
  Switch,
  Text,
} from "@shared/ui";
import {
  INPUT_BAR_DEFAULT_LAYOUT,
  InputBar,
  InputBarInputAction,
  KeyboardInputBar,
} from "@shared/ui/input-bar";
import { JsInputBar } from "@shared/ui/input-bar/JsInputBar";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useMemo, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet } from "react-native";

type EventEntry = { time: string; text: string };

const now = () => {
  const d = new Date();

  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

export const InputBarPage: FC<StackProps> = observer(() => {
  const { isDark } = useTheme();

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

  // ─── Компенсация клавиатуры ────────────────────────────────────────────
  // Инсеты и панель — `useKeyboardInset`, скролл — отдельный
  // `useKeyboardScrollCompensation`. Подписка на клавиатуру одна.

  const kb = useKeyboardInset({
    initialBarHeight: INPUT_BAR_DEFAULT_LAYOUT.inputBarMinHeight,
  });
  const compensation = useKeyboardScrollCompensation(
    kb.contentInset,
    kb.reservedInset,
  );

  // Нативной панели нужна явная высота в стиле (см. ниже), поэтому замер
  // дублируется в состояние. Хуку хватает shared value.
  const [inputBarHeight, setInputBarHeight] = useState(
    INPUT_BAR_DEFAULT_LAYOUT.inputBarMinHeight,
  );

  const handleHeightChange = useCallback(
    ({ height }: { height: number }) => {
      kb.setBarHeight(height);
      setInputBarHeight(height);
    },
    [kb],
  );

  // Нативная панель под Fabric не участвует в измерении Yoga (intrinsicContentSize
  // не спрашивают), поэтому без явной высоты её фрейм нулевой — применяем ту
  // высоту, которую она сама сообщила. JS-панель меряет себя сама.
  // Отставание на кадр не видно: панель прибита к низу своего фрейма и
  // раскрывается вверх сама, фрейм лишь догоняет (см. RNInputBar.swift).
  const barStyle = useMemo(
    () => (useNative ? { height: inputBarHeight } : undefined),
    [useNative, inputBarHeight],
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
        {/* Порт тапа по коллекции с view.endEditing(true): штатный
            keyboardShouldPersistTaps умеет гасить только RN-инпуты, а фокус
            нативной панели держит UITextView пода — RN про него не знает.
            Keyboard.dismiss() уходит в endEditing по всему окну и снимает
            фокус в обеих реализациях. */}
        <Pressable onPress={Keyboard.dismiss}>
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
        </Pressable>
      </KeyboardScrollView>

      <KeyboardInputBar offset={kb.occludedBottom}>
        <Bar
          theme={theme}
          style={barStyle}
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
