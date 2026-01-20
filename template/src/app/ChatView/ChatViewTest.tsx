import { Container, Row, TextInput, Touchable } from "@components";
import { BlurView } from "@react-native-community/blur";
import { AirplayIcon, SendIcon } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatViewNative } from "./ChatViewNative";
import { ChatRef, RawMessage } from "./types";

export const ChatViewTest = () => {
  const chatRef = useRef<ChatRef>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const [inputValue, setInputValue] = useState("");

  // Генерируем начальные сообщения
  useEffect(() => {
    const initialMsgs = new Array(100).fill(null).map((_, i) => ({
      id: generateUUID(),
      date: Date.now() - (30 - i),
      userId: i % 2 === 0 ? 0 : 3, // 0 - я, 3 - собеседник
      status: "read" as const,
      data: { text: `Initial message ${i}: ${generateRandomText(5)}` },
    }));

    setTimeout(() => {
      chatRef.current?.appendMessages(initialMsgs);
    }, 0);
  }, []);

  const handleAddMessage = () => {
    const newMsg: RawMessage = {
      id: generateUUID(),
      date: Date.now(),
      userId: 0,
      status: "sent",
      data: { text: inputValue },
    };

    setInputValue("");

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
        keyboardDismissMode="interactive"
        keyboardScrollOffset={-bottom + 8}
        initialScrollIndex={44}
        onLoadPreviousMessages={() =>
          console.log("Native requested more messages")
        }
        onDelete={id => chatRef.current?.deleteMessage(id)}
        onVisibleMessages={ids => console.log("Visible IDs:", ids)}
        onScroll={e => console.log("Scroll Y:", e.contentOffset.y)}
        onScrollBeginDrag={() => console.log("Started Dragging")}
        onMomentumScrollEnd={() => console.log("Stopped Momentum")}
        onScrollAnimationEnd={() => console.log("Animation End")}
        onScrollEndDrag={() => console.log("End Dragging")}
        style={StyleSheet.absoluteFill}
        insets={{ bottom: bottom + inputHeight + 16, top }}
      />

      <KeyboardAvoidingView
        keyboardVerticalOffset={8}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          marginTop: "auto",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: bottom,
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
            radius={16}
            width={44}
            centerContent={true}
            overflow={"hidden"}
            onPress={() => {}}
          >
            <BlurView
              blurType={"dark"}
              blurAmount={1}
              style={StyleSheet.absoluteFill}
            />
            <AirplayIcon color={"#fff"} size={18} />
          </Touchable>
          <Row flex={1} radius={16} overflow={"hidden"}>
            <BlurView
              blurType={"dark"}
              blurAmount={1}
              style={StyleSheet.absoluteFill}
            />
            <TextInput
              style={{ flex: 1, padding: 16 }}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={"Введите сообщение"}
              numberOfLines={6}
              multiline={true}
            />
          </Row>
          <Touchable
            radius={16}
            width={44}
            centerContent={true}
            overflow={"hidden"}
            onPress={handleAddMessage}
            disabled={!inputValue}
          >
            <BlurView
              blurType={"dark"}
              blurAmount={1}
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
    backgroundColor: "#f5f5f5",
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
