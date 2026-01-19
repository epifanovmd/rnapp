import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { ChatViewNative } from "./ChatViewNative";
import { ChatRef, RawMessage } from "./types";

export const ChatViewTest = () => {
  const chatRef = useRef<ChatRef>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showIndicator, setShowIndicator] = useState(true);

  // Генерируем начальные сообщения
  useEffect(() => {
    const initialMsgs = new Array(100).fill(null).map((_, i) => ({
      id: generateUUID(),
      date: Date.now() - (30 - i) * 100000,
      userId: i % 2 === 0 ? 0 : 3, // 0 - я, 3 - собеседник
      status: "read" as const,
      data: { text: `Initial message ${i}: ${generateRandomText(5)}` },
    }));

    // Даем нативу время инициализироваться перед отправкой данных
    setTimeout(() => {
      chatRef.current?.appendMessages(initialMsgs);
    }, 500);
  }, []);

  const handleAddMessage = () => {
    const newMsg: RawMessage = {
      id: generateUUID(),
      date: Date.now(),
      userId: 0,
      status: "sent",
      data: { text: generateRandomText(10) },
    };

    chatRef.current?.appendMessages([newMsg]);
  };

  return (
    <View style={styles.container}>
      {/* Секция настроек (Props) */}
      <View style={styles.settingsBar}>
        <View style={styles.settingItem}>
          <Text>Scroll</Text>
          <Switch value={scrollEnabled} onValueChange={setScrollEnabled} />
        </View>
        <View style={styles.settingItem}>
          <Text>Indicator</Text>
          <Switch value={showIndicator} onValueChange={setShowIndicator} />
        </View>
      </View>

      {/* Нативный чат */}
      <View style={styles.chatContainer}>
        <ChatViewNative
          ref={chatRef}
          userId={0}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={showIndicator}
          keyboardDismissMode="interactive"
          // Тест начальной прокрутки (раскомментируйте один для теста)
          initialScrollIndex={44}
          // initialScrollOffset={500}

          onLoadPreviousMessages={() =>
            console.log("Native requested more messages")
          }
          onDelete={id => chatRef.current?.deleteMessage(id)}
          onVisibleMessages={ids => console.log("Visible IDs:", ids)}
          onScroll={e => console.log("Scroll Y:", e.contentOffset.y)}
          onScrollBeginDrag={() => console.log("Started Dragging")}
          onMomentumScrollEnd={() => console.log("Stopped Momentum")}
        />
      </View>

      {/* Панель управления методами (Methods) */}
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.buttonGroup}>
            <Button title="Send" onPress={handleAddMessage} color="#4CAF50" />
            <Button
              title="To Bottom"
              onPress={() => chatRef.current?.scrollToBottom(true)}
            />
            <Button
              title="To Index 13"
              onPress={() => chatRef.current?.scrollToIndex(33, true)}
            />
            <Button
              title="To Offset 200"
              onPress={() => chatRef.current?.scrollToOffset(200, true)}
            />
            <Button
              title="To Today"
              onPress={() => chatRef.current?.scrollToDate(Date.now(), true)}
            />
            <Button
              title="Typing: On"
              onPress={() => chatRef.current?.setTyping(true)}
            />
            <Button
              title="Typing: Off"
              onPress={() => chatRef.current?.setTyping(false)}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 44,
  },
  settingsBar: {
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
