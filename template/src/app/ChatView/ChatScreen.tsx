// ChatScreen.tsx
// Full example usage of ChatView component

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import ChatView, {
  type ChatAction,
  type ChatMessage,
  type ChatViewHandle,
  type ReplyReference,
} from "./ChatView";

// ---- Helpers ----

let idCounter = 1000;
// eslint-disable-next-line no-plusplus
const uid = () => String(++idCounter);

const ago = (ms: number) => Date.now() - ms;
const min = (n: number) => n * 60_000;
const hr = (n: number) => n * 3_600_000;
const day = (n: number) => n * 86_400_000;

// ---- Rich mock message set (oldest → newest) ----

const INITIAL_MESSAGES: ChatMessage[] = [
  // 14 days ago
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
    text: "Absolutely amazing. The food, the architecture… check out these shots!",
    images: [
      {
        url: "https://picsum.photos/seed/lisbon1/600/400",
        width: 600,
        height: 400,
      },
      {
        url: "https://picsum.photos/seed/lisbon2/600/400",
        width: 600,
        height: 400,
      },
      {
        url: "https://picsum.photos/seed/lisbon3/600/400",
        width: 600,
        height: 400,
      },
    ],
    timestamp: ago(day(14) - min(9)),
    status: "read",
  },
  // 10 days ago
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
    },
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
  // 5 days ago
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
    replyTo: { id: "11", senderName: "Alice", hasImages: true },
    timestamp: ago(day(5) - min(2)),
    status: "read",
  },
  // Yesterday
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
  // Today
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
    text: "Sure! Here's the agenda in the meantime",
    images: [
      {
        url: "https://picsum.photos/seed/doc1/600/400",
        width: 600,
        height: 400,
      },
      {
        url: "https://picsum.photos/seed/doc2/600/400",
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

const makeOlderBatch = (beforeTimestamp: number): ChatMessage[] => {
  const base = beforeTimestamp - day(7);

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
          url: `https://picsum.photos/seed/old${uid()}/600/400`,
          width: 600,
          height: 400,
        },
      ],
      timestamp: base + min(10),
      status: "read",
    },
  ];
};

// ---- Context Menu Actions ----

const CHAT_ACTIONS: ChatAction[] = [
  { id: "reply", title: "Reply", systemImage: "arrowshape.turn.up.left" },
  { id: "copy", title: "Copy", systemImage: "doc.on.doc" },
  { id: "forward", title: "Forward", systemImage: "arrowshape.turn.up.right" },
  { id: "delete", title: "Delete", systemImage: "trash", isDestructive: true },
];

// ---- Chat Screen ----

const ChatScreen: React.FC = () => {
  const chatRef = useRef<ChatViewHandle>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null);
  // ---- Send ----

  const handleSendMessage = useCallback(
    ({ text, replyToId }: { text: string; replyToId?: string }) => {
      const replyRef: ReplyReference | undefined = replyToId
        ? (() => {
            const src = messages.find(m => m.id === replyToId);

            if (!src) return undefined;

            return {
              id: src.id,
              text: src.text,
              senderName: src.senderName ?? (src.isMine ? "You" : undefined),
              hasImages: (src.images?.length ?? 0) > 0,
            } satisfies ReplyReference;
          })()
        : undefined;

      const newMsg: ChatMessage = {
        id: uid(),
        text,
        timestamp: Date.now(),
        isMine: true,
        status: "sending",
        replyTo: replyRef,
      };

      setMessages(prev => [...prev, newMsg]);
      setReplyMessage(null);

      setTimeout(
        () =>
          setMessages(prev =>
            prev.map(m => (m.id === newMsg.id ? { ...m, status: "sent" } : m)),
          ),
        800,
      );
      setTimeout(
        () =>
          setMessages(prev =>
            prev.map(m =>
              m.id === newMsg.id ? { ...m, status: "delivered" } : m,
            ),
          ),
        2000,
      );

      setTimeout(() => chatRef.current?.scrollToBottom(), 50);
    },
    [messages],
  );

  // ---- Load older (called at most once per batch by native throttle) ----

  const handleReachTop = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => {
        const oldest = prev.reduce(
          (mn, m) => (m.timestamp < mn ? m.timestamp : mn),
          prev[0]?.timestamp ?? Date.now(),
        );

        return [...makeOlderBatch(oldest), ...prev];
      });
      setIsLoading(false);
    }, 0);
  }, []);

  // ---- Reply ----

  const handleReplyMessagePress = useCallback(
    ({ messageId }: { messageId: string }) => {
      chatRef.current?.scrollToMessage(messageId, {
        position: "center",
        animated: true,
        highlight: true,
      });
    },
    [],
  );

  // ---- Action menu ----

  const handleActionPress = useCallback(
    ({
      actionId,
      messageId,
      message,
    }: {
      actionId: string;
      messageId: string;
      message: ChatMessage;
    }) => {
      switch (actionId) {
        case "reply":
          setReplyMessage(message);
          break;
        case "copy":
          Alert.alert("Copied!", message.text ?? "No text");
          break;
        case "forward":
          Alert.alert("Forward", `Forwarding: ${messageId}`);
          break;
        case "delete":
          Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () =>
                setMessages(p => p.filter(m => m.id !== messageId)),
            },
          ]);
          break;
      }
    },
    [],
  );

  const handleAttachmentPress = useCallback(() => {
    Alert.alert("Attachments", "Attachment picker would open here");
  }, []);

  const handleMessagesVisible = useCallback(
    ({ messageIds }: { messageIds: string[] }) => {
      console.log("Visible:", messageIds);
    },
    [],
  );

  const handleMessagePress = useCallback(
    ({ message }: { messageId: string; message: ChatMessage }) => {
      if (message.images?.length)
        Alert.alert("Image Message", `${message.images.length} image(s)`);
    },
    [],
  );

  // ---- Render ----
  // Plain background View — native chat fills 100%, no SafeAreaView / header / banners

  return (
    <ChatView
      ref={chatRef}
      style={styles.chat}
      messages={messages}
      actions={CHAT_ACTIONS}
      topThreshold={200}
      // initialScrollToMessageId={"13"}
      isLoading={isLoading}
      replyMessage={replyMessage}
      onReachTop={handleReachTop}
      onMessagesVisible={handleMessagesVisible}
      onMessagePress={handleMessagePress}
      onActionPress={handleActionPress}
      onSendMessage={handleSendMessage}
      onAttachmentPress={handleAttachmentPress}
      onReplyMessagePress={handleReplyMessagePress}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#342b2b",
  },
  chat: {
    flex: 1,
  },
});

export default ChatScreen;
