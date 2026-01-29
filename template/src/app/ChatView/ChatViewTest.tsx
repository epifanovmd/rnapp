import { Container, Row, TextInput, Touchable } from "@components";
import { BlurView } from "@react-native-community/blur";
import { AirplayIcon, SendIcon } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatViewNative } from "./ChatViewNative";
import { ChatConfiguration, ChatRef, RawMessage } from "./types";

export const ChatViewTest = () => {
  const chatRef = useRef<ChatRef>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [loadedPages, setLoadedPages] = useState(0);
  const oldestTimestampRef = useRef<number>(Date.now());
  const messagesRef = useRef<RawMessage[]>([]);
  const [config] = useState<ChatConfiguration>({
    layout: {
      maxMessageWidthRatio: 0.72,
      interItemSpacing: 4,
      interSectionSpacing: 18,
      bubbleContentInsets: { top: 6, left: 10, bottom: 6, right: 10 },
      tailSize: 6,
      avatarSize: 28,
    },
    behavior: {
      showsAvatars: false,
      showsDateSeparators: true,
      showsStatus: true,
      showsMessageTime: true,
      showsReplyPreview: true,
      showsBubbleTail: false,
      showsScrollHighlight: true,
      scrollHighlightDuration: 0.8,
      scrollToCenterOnIdIndex: true,
    },
    colors: {
      background: "#e6ebf2",
      incomingBubble: "#ffffff",
      outgoingBubble: "#dcf8c6",
      incomingText: "#111827",
      outgoingText: "#111827",
      incomingLink: "#2688eb",
      outgoingLink: "#2688eb",
      messageTimeText: "#8b95a1",
      messageSenderText: "#4b5563",
      dateSeparatorText: "#6b7280",
      dateSeparatorBackground: "#d6dde8",
      statusSent: "#9aa4b2",
      statusReceived: "#5aa0ff",
      statusRead: "#5aa0ff",
    },
    dateFormatting: {
      dateSeparatorFormat: "d MMMM, EEEE",
      messageTimeFormat: "HH:mm",
      locale: "ru_RU",
    },
  });

  // Генерируем начальные сообщения
  useEffect(() => {
    const now = Date.now();
    const total = 50;
    const initialMsgs: any[] = [];

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < total; i++) {
      const daysBack = Math.floor((total - i) / 12);
      const timestamp =
        now - daysBack * 24 * 60 * 60 * 1000 - (total - i) * 60 * 1000;
      const isSystem = i % 11 === 0;
      const user = isSystem
        ? { id: 999, displayName: "System" }
        : {
            id: i % 2 === 0 ? 0 : 3,
            displayName: i % 2 === 0 ? "Я" : "Alex",
            avatar:
              i % 2 === 0 ? undefined : "https://i.pravatar.cc/100?img=12",
          };

      let data: any;

      if (isSystem) {
        data = {
          type: "system",
          text: "Системное сообщение: правила обновлены",
        };
      } else if (i % 7 === 0) {
        data = { type: "image", image: "https://picsum.photos/300/200" };
      } else if (i % 5 === 0) {
        data = { type: "custom", kind: "badge", payload: "Новый тип" };
      } else {
        data = {
          type: "text",
          text: `Initial message ${i}: ${generateRandomText(5)}`,
        };
      }

      const message: RawMessage = {
        id: generateUUID(),
        date: timestamp,
        user,
        status: "read" as const,
        data,
      };

      if (!isSystem && i % 8 === 3 && initialMsgs.length > 0) {
        message.replyToId = initialMsgs[Math.max(0, initialMsgs.length - 2)].id;
      }

      initialMsgs.push(message);
    }

    setTimeout(() => {
      chatRef.current?.setMessages(initialMsgs);
      messagesRef.current = initialMsgs;
      oldestTimestampRef.current = initialMsgs[0].date;
    }, 0);
  }, []);

  const loadPreviousMessages = () => {
    const pageSize = 20;
    const base = oldestTimestampRef.current - 60 * 1000;
    const batch = new Array(pageSize).fill(null).map((_, i) => {
      const timestamp = base - i * 60 * 1000;

      const message: any = {
        id: generateUUID(),
        date: timestamp,
        user: {
          id: (loadedPages + i) % 2 === 0 ? 3 : 0,
          displayName: (loadedPages + i) % 2 === 0 ? "Alex" : "Я",
          avatar:
            (loadedPages + i) % 2 === 0
              ? "https://i.pravatar.cc/100?img=12"
              : undefined,
        },
        status: "read" as const,
        data:
          i % 6 === 0
            ? { type: "custom", kind: "reaction", payload: "🔥" }
            : {
                type: "text",
                text: `Older message ${
                  loadedPages * pageSize + i
                }: ${generateRandomText(6)}`,
              },
      };

      if (i % 7 === 0 && messagesRef.current.length > 0) {
        message.replyToId = messagesRef.current[0]?.id;
      }

      return message;
    });

    oldestTimestampRef.current = batch[batch.length - 1].date;
    setLoadedPages(prev => prev + 1);
    messagesRef.current = [...batch, ...messagesRef.current];
    chatRef.current?.appendMessages(batch);
  };

  const handleAddMessage = () => {
    const newMsg: RawMessage = {
      id: generateUUID(),
      date: Date.now(),
      user: {
        id: 0,
        displayName: "Я",
      },
      status: "sent",
      data: { type: "text", text: inputValue },
    };

    setInputValue("");

    messagesRef.current = [...messagesRef.current, newMsg];
    chatRef.current?.appendMessages([newMsg]);
    chatRef.current?.scrollToBottom(true);
  };

  const { bottom, top } = useSafeAreaInsets();

  return (
    <Container edges={["top"]} style={[styles.container]}>
      <BlurView
        blurType={"light"}
        blurAmount={1}
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: top,
            zIndex: 999,
          },
        ]}
      />
      <ChatViewNative
        ref={chatRef}
        userId={0}
        configuration={config}
        keyboardDismissMode="interactive"
        keyboardScrollOffset={-bottom + 8}
        initialScrollIndex={4}
        initialScrollOffset={120}
        onLoadPreviousMessages={loadPreviousMessages}
        onDelete={id => chatRef.current?.deleteMessage(id)}
        onVisibleMessages={ids => console.log("Visible IDs:", ids)}
        onScroll={e => console.log("Scroll Y:", e.contentOffset.y)}
        onScrollBeginDrag={() => console.log("Started Dragging")}
        onMomentumScrollEnd={() => console.log("Stopped Momentum")}
        onScrollAnimationEnd={() => console.log("Animation End")}
        onScrollEndDrag={() => console.log("End Dragging")}
        style={[StyleSheet.absoluteFill, { backgroundColor: "#e6ebf2" }]}
        insets={{ bottom: bottom + inputHeight + 16, top }}
      />

      <KeyboardAvoidingView
        keyboardVerticalOffset={8}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          marginTop: "auto",
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: bottom,
          marginHorizontal: 8,
        }}
      >
        <Row
          alignItems={"stretch"}
          onLayout={({ nativeEvent: { layout } }) => {
            setInputHeight(layout.height);
          }}
          ph={16}
          height={44}
          gap={8}
        >
          <Touchable
            radius={18}
            width={44}
            centerContent={true}
            overflow={"hidden"}
          >
            <BlurView
              blurType={"light"}
              blurAmount={8}
              style={StyleSheet.absoluteFill}
            />
            <AirplayIcon color={"#60a5fa"} size={18} />
          </Touchable>
          <Row flex={1} radius={18} overflow={"hidden"}>
            <BlurView
              blurType={"light"}
              blurAmount={8}
              style={StyleSheet.absoluteFill}
            />
            <TextInput
              style={{ flex: 1, padding: 12 }}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={"Введите сообщение"}
              numberOfLines={6}
              multiline={true}
            />
          </Row>
          <Touchable
            radius={18}
            width={44}
            centerContent={true}
            overflow={"hidden"}
            onPress={handleAddMessage}
            disabled={!inputValue}
          >
            <BlurView
              blurType={"light"}
              blurAmount={8}
              style={StyleSheet.absoluteFill}
              pointerEvents={"none"}
            />
            <SendIcon
              color={"#fff"}
              size={18}
              disabled={true}
              pointerEvents={"none"}
            />
          </Touchable>
        </Row>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e6ebf2",
  },
  settingsBar: {
    zIndex: 1000,
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    justifyContent: "space-around",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  controls: {
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingBottom: 24,
  },
  buttonGroup: {
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 10,
  },
});

export const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    // eslint-disable-next-line no-bitwise
    const v = c === "x" ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
};

export const generateRandomText = (wordsCount: number = 6): string => {
  const words = [
    "alias",
    "consequatur",
    "aut",
    "perferendis",
    "sit",
    "voluptatem",
    "accusantium",
    "doloremque",
    "aperiam",
    "eaque",
    "ipsa",
    "quae",
    "ab",
    "illo",
    "inventore",
    "veritatis",
    "et",
    "quasi",
    "architecto",
    "beatae",
    "vitae",
    "dicta",
    "sunt",
    "explicabo",
    "aspernatur",
    "aut",
    "odit",
    "aut",
    "fugit",
    "sed",
    "quia",
    "consequuntur",
    "magni",
    "dolores",
    "eos",
    "qui",
    "ratione",
    "voluptatem",
    "sequi",
    "nesciunt",
    "neque",
    "dolorem",
    "ipsum",
    "quia",
    "dolor",
    "sit",
    "amet",
    "consectetur",
    "adipisci",
    "velit",
    "sed",
    "quia",
    "non",
    "numquam",
    "eius",
    "modi",
    "tempora",
    "incidunt",
    "ut",
    "labore",
    "et",
    "dolore",
    "magnam",
    "aliquam",
    "quaerat",
    "voluptatem",
    "ut",
    "enim",
    "ad",
    "minima",
    "veniam",
    "quis",
    "nostrum",
    "exercitationem",
    "ullam",
    "corporis",
    "nemo",
    "enim",
    "ipsam",
    "voluptatem",
    "quia",
    "voluptas",
    "sit",
    "suscipit",
    "laboriosam",
    "nisi",
    "ut",
    "aliquid",
    "ex",
    "ea",
    "commodi",
    "consequatur",
    "quis",
    "autem",
    "vel",
    "eum",
    "iure",
    "reprehenderit",
    "qui",
    "in",
    "ea",
    "voluptate",
    "velit",
    "esse",
    "quam",
    "nihil",
    "molestiae",
    "et",
    "iusto",
    "odio",
    "dignissimos",
    "ducimus",
    "qui",
    "blanditiis",
    "praesentium",
    "laudantium",
    "totam",
    "rem",
    "voluptatum",
    "deleniti",
    "atque",
    "corrupti",
    "quos",
    "dolores",
    "et",
    "quas",
    "molestias",
    "excepturi",
    "sint",
    "occaecati",
    "cupiditate",
    "non",
    "provident",
    "sed",
    "ut",
    "perspiciatis",
    "unde",
    "omnis",
    "iste",
    "natus",
    "error",
    "similique",
    "sunt",
    "in",
    "culpa",
    "qui",
    "officia",
    "deserunt",
    "mollitia",
    "animi",
    "id",
    "est",
    "laborum",
    "et",
    "dolorum",
    "fuga",
    "et",
    "harum",
    "quidem",
    "rerum",
    "facilis",
    "est",
    "et",
    "expedita",
    "distinctio",
    "nam",
    "libero",
    "tempore",
    "cum",
    "soluta",
    "nobis",
    "est",
    "eligendi",
    "optio",
    "cumque",
    "nihil",
    "impedit",
    "quo",
    "porro",
    "quisquam",
    "est",
    "qui",
    "minus",
    "id",
    "quod",
    "maxime",
    "placeat",
    "facere",
    "possimus",
    "omnis",
    "voluptas",
    "assumenda",
    "est",
    "omnis",
    "dolor",
    "repellendus",
    "temporibus",
    "autem",
    "quibusdam",
    "et",
    "aut",
    "consequatur",
    "vel",
    "illum",
    "qui",
    "dolorem",
    "eum",
    "fugiat",
    "quo",
    "voluptas",
    "nulla",
    "pariatur",
    "at",
    "vero",
    "eos",
    "et",
    "accusamus",
    "officiis",
    "debitis",
    "aut",
    "rerum",
    "necessitatibus",
    "saepe",
    "eveniet",
    "ut",
    "et",
    "voluptates",
    "repudiandae",
    "sint",
    "et",
    "molestiae",
    "non",
    "recusandae",
    "itaque",
    "earum",
    "rerum",
    "hic",
    "tenetur",
    "a",
    "sapiente",
    "delectus",
    "ut",
    "aut",
    "reiciendis",
    "voluptatibus",
    "maiores",
    "doloribus",
    "asperiores",
    "repellat",
  ];

  if (wordsCount <= 0) return "";

  // Перемешиваем и выбираем нужное количество
  const resultWords = [...words]
    .sort(() => 0.5 - Math.random())
    .slice(0, wordsCount);

  let sentence = resultWords.join(" ");

  // Делаем первую букву заглавной и добавляем точку
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";

  return sentence;
};
