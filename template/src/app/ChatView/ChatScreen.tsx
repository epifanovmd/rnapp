// ChatScreen.tsx
// Пример экрана чата — демонстрирует полное использование ChatView.
// Все типы импортируются из ChatView (который реэкспортирует их из NativeChatViewSpec).

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, useColorScheme } from "react-native";

import {
  type ChatAction,
  type ChatActionPressEventData,
  type ChatAttachmentPressEventData,
  type ChatMessage,
  type ChatMessagePressEventData,
  type ChatMessagesVisibleEventData,
  type ChatReachTopEventData,
  type ChatReplyMessagePressEventData,
  type ChatReplyRef,
  type ChatSendMessageEventData,
  ChatView,
} from "./ChatView";

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _idCounter = 1000;
// eslint-disable-next-line no-plusplus
const uid = () => String(++_idCounter);
const ago = (ms: number) => Date.now() - ms;
const min = (n: number) => n * 60_000;
const hr = (n: number) => n * 3_600_000;
const day = (n: number) => n * 86_400_000;

// ─── Initial messages ────────────────────────────────────────────────────────

const INITIAL_MESSAGES: ChatMessage[] = [
  // 14 дней назад
  {
    id: "1",
    isMine: false,
    senderName: "Alice",
    text: "Hey! Long time no see 👋",
    timestamp: ago(day(14)),
    status: "read",
  },
  {
    id: "2",
    isMine: true,
    text: "Alice! Yeah it's been a while. How are you?",
    timestamp: ago(day(14) - min(2)),
    status: "read",
  },
  {
    id: "3",
    isMine: false,
    senderName: "Alice",
    text: "Doing great! Just got back from a trip to Portugal 🇵🇹",
    timestamp: ago(day(14) - min(5)),
    status: "read",
  },
  {
    id: "4",
    isMine: true,
    text: "No way! How was it?",
    timestamp: ago(day(14) - min(7)),
    status: "read",
  },
  {
    id: "5",
    isMine: false,
    senderName: "Alice",
    text: "Absolutely amazing. The food, the architecture… check out this shot!",
    images: [
      {
        url: "https://picsum.photos/seed/lisbon1/600/400",
        width: 600,
        height: 400,
      },
    ],
    timestamp: ago(day(14) - min(9)),
    status: "read",
  },
  // 10 дней назад
  {
    id: "6",
    isMine: true,
    text: "These are stunning 😍 I need to visit!",
    timestamp: ago(day(10)),
    status: "read",
  },
  {
    id: "7",
    isMine: false,
    senderName: "Bob",
    text: "Wait, you went to Portugal without me?! 😤",
    timestamp: ago(day(10) - min(3)),
    status: "read",
  },
  {
    id: "8",
    isMine: false,
    senderName: "Alice",
    text: "Sorry Bob 😂 Next time for sure",
    timestamp: ago(day(10) - min(5)),
    status: "read",
  },
  {
    id: "9",
    isMine: true,
    text: "Bob, we should all plan a trip together",
    replyTo: {
      id: "7",
      text: "Wait, you went to Portugal without me?! 😤",
      senderName: "Bob",
    } satisfies ChatReplyRef,
    timestamp: ago(day(10) - min(8)),
    status: "read",
  },
  {
    id: "10",
    isMine: false,
    senderName: "Bob",
    text: "I'm in! Let's do it 🤙",
    timestamp: ago(day(10) - min(10)),
    status: "read",
  },
  // 5 дней назад
  {
    id: "11",
    isMine: false,
    senderName: "Alice",
    text: "By the way, here's the photo I was telling you about",
    images: [
      {
        url: "https://picsum.photos/seed/sunset1/800/500",
        width: 800,
        height: 500,
      },
    ],
    timestamp: ago(day(5)),
    status: "read",
  },
  {
    id: "12",
    isMine: true,
    text: "Wow, that sunset is incredible 🌅",
    replyTo: {
      id: "11",
      senderName: "Alice",
      hasImages: true,
    } satisfies ChatReplyRef,
    timestamp: ago(day(5) - min(2)),
    status: "read",
  },
  // Вчера
  {
    id: "13",
    isMine: false,
    senderName: "Bob",
    text: "Did you finish the report yet?",
    timestamp: ago(day(1) + hr(3)),
    status: "read",
  },
  {
    id: "14",
    isMine: true,
    text: "Almost! Just the last section left",
    timestamp: ago(day(1) + hr(3) - min(5)),
    status: "read",
  },
  {
    id: "15",
    isMine: false,
    senderName: "Bob",
    text: "Great, no rush. Take your time 👍",
    timestamp: ago(day(1) + hr(3) - min(10)),
    status: "read",
  },
  {
    id: "16",
    isMine: true,
    text: "Done! Sent it over email",
    timestamp: ago(day(1) + hr(1)),
    status: "read",
  },
  {
    id: "17",
    isMine: false,
    senderName: "Bob",
    text: "Perfect, thanks! 🙏",
    timestamp: ago(day(1) + hr(1) - min(2)),
    status: "read",
  },
  // Сегодня
  {
    id: "18",
    isMine: false,
    senderName: "Alice",
    text: "Good morning everyone ☀️",
    timestamp: ago(hr(4)),
    status: "read",
  },
  {
    id: "19",
    isMine: true,
    text: "Morning! Ready for the standup?",
    timestamp: ago(hr(4) - min(1)),
    status: "read",
  },
  {
    id: "20",
    isMine: false,
    senderName: "Bob",
    text: "Yep, give me 5 minutes ⏱",
    timestamp: ago(hr(4) - min(2)),
    status: "read",
  },
  {
    id: "21",
    isMine: false,
    senderName: "Alice",
    text: "Sure! Here's the agenda",
    images: [
      {
        url: "https://picsum.photos/seed/doc1/600/400",
        width: 600,
        height: 400,
      },
    ],
    timestamp: ago(hr(4) - min(3)),
    status: "read",
  },
  {
    id: "22",
    isMine: true,
    text: "Looks good to me 👌",
    timestamp: ago(hr(2)),
    status: "delivered",
  },
  {
    id: "23",
    isMine: false,
    senderName: "Alice",
    text: "Great call everyone! Talk later 👋",
    timestamp: ago(hr(1)),
    status: "read",
  },
  {
    id: "24",
    isMine: true,
    text: "👋",
    timestamp: ago(min(30)),
    status: "sent",
  },
];

// ─── Older messages generator ────────────────────────────────────────────────

const makeOlderBatch = (beforeTimestamp: number): ChatMessage[] => {
  const base = beforeTimestamp - day(7);
  const photoId = uid();

  return [
    {
      id: uid(),
      isMine: false,
      senderName: "Alice",
      text: "Remember that project we did last year?",
      timestamp: base,
      status: "read",
    },
    {
      id: uid(),
      isMine: true,
      text: "Of course! That was a tough one 😅",
      timestamp: base + min(3),
      status: "read",
    },
    {
      id: uid(),
      isMine: false,
      senderName: "Bob",
      text: "But we nailed it in the end 💪",
      timestamp: base + min(6),
      status: "read",
    },
    {
      id: uid(),
      isMine: true,
      text: "True! Good times 🙌",
      timestamp: base + min(8),
      status: "read",
    },
    {
      id: uid(),
      isMine: false,
      senderName: "Alice",
      text: "Here's a photo from that day",
      images: [
        {
          url: `https://picsum.photos/seed/old${photoId}/600/400`,
          width: 600,
          height: 400,
        },
      ],
      timestamp: base + min(10),
      status: "read",
    },
  ];
};

// ─── Context menu actions ─────────────────────────────────────────────────────

const CHAT_ACTIONS: ChatAction[] = [
  { id: "reply", title: "Reply", systemImage: "arrowshape.turn.up.left" },
  { id: "copy", title: "Copy", systemImage: "doc.on.doc" },
  { id: "forward", title: "Forward", systemImage: "arrowshape.turn.up.right" },
  { id: "delete", title: "Delete", systemImage: "trash", isDestructive: true },
];

// ─── ChatScreen ───────────────────────────────────────────────────────────────

const ChatScreen: React.FC = () => {
  const chatRef = useRef<ChatView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null);

  // Автоматически следуем системной теме устройства
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";

  // messagesRef: актуальный список без stale closure в колбэках
  const messagesRef = useRef<ChatMessage[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Управление таймерами: Set с auto-cleanup
  const activeTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const scheduleTimer = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      activeTimers.current.delete(id);
      fn();
    }, delay);

    activeTimers.current.add(id);

    return id;
  }, []);

  useEffect(() => {
    const timers = activeTimers.current;

    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  // ─── Send ──────────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    ({ text, replyToId }: ChatSendMessageEventData) => {
      const replyTo: ChatReplyRef | undefined = replyToId
        ? (() => {
            const src = messagesRef.current.find(m => m.id === replyToId);

            if (!src) return undefined;

            return {
              id: src.id,
              text: src.text,
              senderName: src.senderName ?? (src.isMine ? "You" : undefined),
              hasImages: (src.images?.length ?? 0) > 0,
            } satisfies ChatReplyRef;
          })()
        : undefined;

      const newMsg: ChatMessage = {
        id: uid(),
        text,
        timestamp: Date.now(),
        isMine: true,
        status: "sending",
        replyTo,
      };

      setMessages(prev => [...prev, newMsg]);
      setReplyMessage(null);

      scheduleTimer(() => {
        setMessages(prev =>
          prev.map(m => (m.id === newMsg.id ? { ...m, status: "sent" } : m)),
        );
      }, 800);
      scheduleTimer(() => {
        setMessages(prev =>
          prev.map(m =>
            m.id === newMsg.id ? { ...m, status: "delivered" } : m,
          ),
        );
      }, 2500);
      scheduleTimer(() => {
        chatRef.current?.scrollToBottom();
      }, 50);
    },
    [scheduleTimer],
  );

  // ─── Load history ──────────────────────────────────────────────────────────

  const handleReachTop = useCallback(
    ({ distanceFromTop: _ }: ChatReachTopEventData) => {
      if (isLoading) return;
      setIsLoading(true);
      scheduleTimer(() => {
        setMessages(prev => {
          const oldest = prev.reduce(
            (mn, m) => (m.timestamp < mn ? m.timestamp : mn),
            prev[0]?.timestamp ?? Date.now(),
          );

          return [...makeOlderBatch(oldest), ...prev];
        });
        setIsLoading(false);
      }, 300);
    },
    [isLoading, scheduleTimer],
  );

  // ─── Tap on reply → scroll to original ────────────────────────────────────

  const handleReplyMessagePress = useCallback(
    ({ messageId }: ChatReplyMessagePressEventData) => {
      chatRef.current?.scrollToMessage(messageId, {
        position: "center",
        animated: true,
        highlight: true,
      });
    },
    [],
  );

  // ─── Context menu ──────────────────────────────────────────────────────────

  const handleActionPress = useCallback(
    ({ actionId, messageId }: ChatActionPressEventData) => {
      const message = messagesRef.current.find(m => m.id === messageId);

      if (!message) return;

      switch (actionId) {
        case "reply":
          setReplyMessage(message);
          break;
        case "copy":
          Alert.alert("Copied!", message.text ?? "No text");
          break;
        case "forward":
          Alert.alert("Forward", `Forwarding message ${messageId}`);
          break;
        case "delete":
          Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () =>
                setMessages(prev => prev.filter(m => m.id !== messageId)),
            },
          ]);
          break;
      }
    },
    [],
  );

  // ─── Attachment ────────────────────────────────────────────────────────────

  const handleAttachmentPress = useCallback(
    (_: ChatAttachmentPressEventData) => {
      Alert.alert("Attachments", "Attachment picker would open here");
    },
    [],
  );

  // ─── Read receipts ─────────────────────────────────────────────────────────

  const handleMessagesVisible = useCallback(
    ({ messageIds }: ChatMessagesVisibleEventData) => {
      // TODO: отправить read-receipt на сервер
      console.log("[ChatScreen] visible incoming:", messageIds);
    },
    [],
  );

  // ─── Message tap ───────────────────────────────────────────────────────────

  const handleMessagePress = useCallback(
    ({ messageId }: ChatMessagePressEventData) => {
      const message = messagesRef.current.find(m => m.id === messageId);

      if (!message) return;
      if (message.images?.length) {
        Alert.alert("Image", `Photo from ${message.senderName ?? "you"}`);
      }
    },
    [],
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ChatView
      ref={chatRef}
      style={styles.chat}
      messages={messages}
      actions={CHAT_ACTIONS}
      topThreshold={200}
      scrollToBottomThreshold={150}
      // initialScrollId={"6"}
      isLoading={isLoading}
      replyMessage={replyMessage}
      theme={theme}
      onSendMessage={handleSendMessage}
      onReachTop={handleReachTop}
      onReplyMessagePress={handleReplyMessagePress}
      onActionPress={handleActionPress}
      onAttachmentPress={handleAttachmentPress}
      onMessagesVisible={handleMessagesVisible}
      onMessagePress={handleMessagePress}
    />
  );
};

const styles = StyleSheet.create({
  chat: { flex: 1 },
});

export default ChatScreen;
