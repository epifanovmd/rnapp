import {
  EMessageStatus,
  EMessageType,
  MessageAttachmentDto,
  MessageDto,
  PollDto,
} from "@api/api-gen/data-contracts";
import { Col, Navbar, Text } from "@components";
import {
  type ChatAction,
  type ChatActionPressEventData,
  type ChatCancelInputActionEventData,
  type ChatEditMessageEventData,
  type ChatEmojiReactionSelectData,
  type ChatFilePressEventData,
  type ChatInputAction,
  type ChatMessage,
  type ChatMessagesVisibleEventData,
  type ChatPollOptionPressEventData,
  type ChatReachBottomEventData,
  type ChatReachTopEventData,
  type ChatReplyMessagePressEventData,
  type ChatSendMessageEventData,
  type ChatVideoPressEventData,
  ChatView,
} from "@components/chatView";
import { useTheme } from "@core";
import { iocHook } from "@di";
import { StackProps } from "@navigation";
import { IAuthStore } from "@store/auth";
import { useChatStore } from "@store/chat";
import { useMessageStore } from "@store/message";
import { usePollStore } from "@store/poll";
import { formatFullName } from "@utils";
import { observer } from "mobx-react-lite";
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Linking,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

const useAuthStore = iocHook(IAuthStore);

// ─── Message mapping ──────────────────────────────────────────────────────────

const mapStatus = (status: EMessageStatus): ChatMessage["status"] => {
  switch (status) {
    case EMessageStatus.Sent:
      return "sent";
    case EMessageStatus.Delivered:
      return "delivered";
    case EMessageStatus.Read:
      return "read";
    default:
      return "sent";
  }
};

const findAttachmentByType = (
  attachments: MessageAttachmentDto[],
  prefix: string,
): MessageAttachmentDto | undefined =>
  attachments.find(a => a.fileType.startsWith(prefix));

const findFileAttachment = (
  attachments: MessageAttachmentDto[],
): MessageAttachmentDto | undefined =>
  attachments.find(
    a =>
      !a.fileType.startsWith("image/") &&
      !a.fileType.startsWith("video/") &&
      !a.fileType.startsWith("audio/"),
  );

const mapPollToNative = (poll: PollDto) => {
  const totalVotes = poll.totalVotes;

  return {
    id: poll.id,
    question: poll.question,
    options: poll.options.map(o => ({
      id: o.id,
      text: o.text,
      votes: o.voterCount,
      percentage: totalVotes > 0 ? (o.voterCount / totalVotes) * 100 : 0,
    })),
    totalVotes,
    selectedOptionId: poll.userVotedOptionIds?.[0],
    isClosed: poll.isClosed,
  };
};

const mapMessageToNative = (
  msg: MessageDto,
  currentUserId?: string,
): ChatMessage => {
  const isMine = msg.senderId === currentUserId;

  const imageAttachment = findAttachmentByType(msg.attachments, "image/");
  const videoAttachment = findAttachmentByType(msg.attachments, "video/");
  const fileAttachment = findFileAttachment(msg.attachments);

  return {
    id: msg.id,
    text: msg.content ?? undefined,
    timestamp: new Date(msg.createdAt).getTime(),
    isMine,
    senderName: isMine
      ? undefined
      : msg.sender
      ? formatFullName(msg.sender.firstName, msg.sender.lastName)
      : undefined,
    status: mapStatus(msg.status),
    isEdited: msg.isEdited,

    images: imageAttachment
      ? [
          {
            url: imageAttachment.fileUrl,
            width: imageAttachment.width ?? undefined,
            height: imageAttachment.height ?? undefined,
            thumbnailUrl: imageAttachment.thumbnailUrl ?? undefined,
          },
        ]
      : undefined,

    video: videoAttachment
      ? {
          url: videoAttachment.fileUrl,
          thumbnailUrl: videoAttachment.thumbnailUrl ?? undefined,
          width: videoAttachment.width ?? undefined,
          height: videoAttachment.height ?? undefined,
          duration: videoAttachment.duration ?? undefined,
        }
      : undefined,

    poll: msg.poll ? mapPollToNative(msg.poll) : undefined,

    file: fileAttachment
      ? {
          url: fileAttachment.fileUrl,
          name: fileAttachment.fileName,
          size: fileAttachment.fileSize,
          mimeType: fileAttachment.fileType,
        }
      : undefined,

    replyTo: msg.replyTo
      ? {
          id: msg.replyTo.id,
          text: msg.replyTo.content ?? undefined,
          senderName:
            msg.replyTo.senderId === currentUserId
              ? "You"
              : msg.replyTo.sender
              ? formatFullName(
                  msg.replyTo.sender.firstName,
                  msg.replyTo.sender.lastName,
                )
              : undefined,
          hasImages: msg.replyTo.attachments.some(a =>
            a.fileType.startsWith("image/"),
          ),
        }
      : undefined,
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatRoom: FC<StackProps<"ChatRoom">> = observer(
  ({ route, navigation }) => {
    const { chatId } = route.params;
    const { colors } = useTheme();
    const chatStore = useChatStore();
    const messageStore = useMessageStore();
    const pollStore = usePollStore();
    const authStore = useAuthStore();
    const chatRef = useRef<ChatView>(null);
    const colorScheme = useColorScheme();

    const [inputAction, setInputAction] = useState<ChatInputAction | null>(
      null,
    );

    const currentUserId = authStore.user?.id;
    const chat = chatStore.chat;

    // ─── Lifecycle ──────────────────────────────────────────────────────────

    useEffect(() => {
      const initChat = async () => {
        await chatStore.openChat(chatId);
        await messageStore.openChat(chatId);
        messageStore.loadPinnedMessages(chatId);

        // Mark as read with the newest message from others
        const msgs = messageStore.messagesHolder.items;
        const newestFromOther = msgs.find(
          m => m.senderId && m.senderId !== currentUserId,
        );

        if (newestFromOther?.id) {
          messageStore.markAsRead(chatId, newestFromOther.id).catch(() => {});
        }
      };

      initChat();

      return () => {
        chatStore.closeChat();
        messageStore.closeChat();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId]);

    // ─── Data ───────────────────────────────────────────────────────────────

    const messages = messageStore.messagesHolder.items;

    const nativeMessages: ChatMessage[] = useMemo(
      () => messages.map(m => mapMessageToNative(m, currentUserId)),
      [messages, currentUserId],
    );

    const chatDisplayName = chatStore.chatModel?.displayName ?? "";

    const typingText = useMemo(() => {
      const typingMap = messageStore.typingUsers;
      const userIds = Array.from(typingMap.keys());

      if (userIds.length === 0) return null;

      if (userIds.length === 1) {
        const member = chat?.members.find(m => m.userId === userIds[0]);
        const name = member?.profile
          ? formatFullName(member.profile.firstName, member.profile.lastName)
          : "Someone";

        return `${name} is typing...`;
      }

      return `${userIds.length} people are typing...`;
    }, [messageStore.typingUsers, chat]);

    // ─── Per-message context menu actions ────────────────────────────────────

    const getActionsForMessage = useCallback(
      (msg: { isMine?: boolean }): ChatAction[] => {
        const actions: ChatAction[] = [
          {
            id: "reply",
            title: "Reply",
            systemImage: "arrowshape.turn.up.left",
          },
          { id: "copy", title: "Copy", systemImage: "doc.on.doc" },
          {
            id: "forward",
            title: "Forward",
            systemImage: "arrowshape.turn.up.right",
          },
        ];

        if (msg.isMine) {
          actions.push({ id: "edit", title: "Edit", systemImage: "pencil" });
        }

        actions.push({
          id: "pin",
          title: "Pin",
          systemImage: "pin",
        });

        actions.push({
          id: "delete",
          title: "Delete",
          systemImage: "trash",
          isDestructive: true,
        });

        return actions;
      },
      [],
    );

    // ─── Handlers ───────────────────────────────────────────────────────────

    const handleSendMessage = useCallback(
      ({ text, replyToId }: ChatSendMessageEventData) => {
        messageStore.sendMessage(chatId, {
          content: text,
          type: EMessageType.Text,
          replyToId,
        });
        setInputAction(null);
      },
      [messageStore, chatId],
    );

    const handleEditMessage = useCallback(
      ({ text, messageId }: ChatEditMessageEventData) => {
        messageStore.editMessage(messageId, text);
        setInputAction(null);
      },
      [messageStore],
    );

    const handleCancelInputAction = useCallback(
      (_: ChatCancelInputActionEventData) => {
        setInputAction(null);
      },
      [],
    );

    const handleTyping = useCallback(() => {
      chatStore.sendTyping(chatId);
    }, [chatStore, chatId]);

    const handleReachTop = useCallback(
      (_: ChatReachTopEventData) => {
        messageStore.loadMoreMessages(chatId);
      },
      [messageStore, chatId],
    );

    const handleReachBottom = useCallback(
      (_: ChatReachBottomEventData) => {
        messageStore.loadNewerMessages(chatId);
      },
      [messageStore, chatId],
    );

    const handleMessagesVisible = useCallback(
      ({ messageIds }: ChatMessagesVisibleEventData) => {
        const firstId = messageIds[0];

        if (firstId) {
          const msg = messages.find(m => m.id === firstId);

          if (msg && msg.senderId !== currentUserId) {
            messageStore.markAsRead(chatId, firstId);
          }
        }
      },
      [messageStore, messages, currentUserId, chatId],
    );

    const handleActionPress = useCallback(
      ({ actionId, messageId }: ChatActionPressEventData) => {
        const msg = messages.find(m => m.id === messageId);

        switch (actionId) {
          case "reply":
            setInputAction({ type: "reply", messageId });
            break;

          case "edit":
            if (msg?.senderId !== currentUserId) {
              Alert.alert("Edit", "Only your own messages can be edited.");

              return;
            }
            setInputAction({ type: "edit", messageId });
            break;

          case "copy":
            if (msg?.content) {
              Clipboard.setString(msg.content);
            }
            break;

          case "forward":
            // TODO: show chat picker to select destination
            break;

          case "pin":
            if (msg) {
              if (msg.isPinned) {
                messageStore.unpinMessage(messageId);
              } else {
                messageStore.pinMessage(messageId);
              }
            }
            break;

          case "delete":
            Alert.alert("Delete", "Delete this message?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => messageStore.deleteMessage(messageId),
              },
            ]);
            break;
        }
      },
      [messageStore, messages, currentUserId],
    );

    const handleEmojiReaction = useCallback(
      ({ emoji, messageId }: ChatEmojiReactionSelectData) => {
        messageStore.addReaction(messageId, emoji);
      },
      [messageStore],
    );

    const handleReplyMessagePress = useCallback(
      ({ messageId }: ChatReplyMessagePressEventData) => {
        const exists = messages.some(m => m.id === messageId);

        if (exists) {
          chatRef.current?.scrollToMessage(messageId, {
            position: "center",
            animated: true,
            highlight: true,
          });
        } else {
          messageStore.navigateToMessage(chatId, messageId).then(success => {
            if (success) {
              setTimeout(() => {
                chatRef.current?.scrollToMessage(messageId, {
                  position: "center",
                  animated: false,
                  highlight: true,
                });
              }, 100);
            }
          });
        }
      },
      [messageStore, messages, chatId],
    );

    const handleVideoPress = useCallback(
      ({ videoUrl }: ChatVideoPressEventData) => {
        Linking.openURL(videoUrl).catch(() => {
          Alert.alert("Error", "Cannot open video");
        });
      },
      [],
    );

    const handlePollOptionPress = useCallback(
      ({ pollId, optionId }: ChatPollOptionPressEventData) => {
        pollStore.vote(pollId, [optionId]);
      },
      [pollStore],
    );

    const handleFilePress = useCallback(
      ({ fileUrl }: ChatFilePressEventData) => {
        Linking.openURL(fileUrl).catch(() => {
          Alert.alert("Error", "Cannot open file");
        });
      },
      [],
    );

    const handleGoBack = useCallback(() => {
      navigation.goBack();
    }, [navigation]);

    const handleChatInfo = useCallback(() => {
      (navigation as any).navigate("ChatInfo", { chatId });
    }, [navigation, chatId]);

    // ─── Render ─────────────────────────────────────────────────────────────

    const isInitialLoading =
      messageStore.messagesHolder.isLoading && messages.length === 0;

    if (isInitialLoading) {
      return (
        <Col flex={1}>
          <Navbar title={chatDisplayName} safeArea>
            <Navbar.BackButton onPress={handleGoBack} />
            <Navbar.Title />
          </Navbar>
          <Col flex={1} justifyContent={"center"} alignItems={"center"}>
            <ActivityIndicator size={"large"} color={colors.blue600} />
          </Col>
        </Col>
      );
    }

    return (
      <Col flex={1}>
        <Navbar title={chatDisplayName} safeArea>
          <Navbar.BackButton onPress={handleGoBack} />
          <Navbar.Title onPress={handleChatInfo} />
          {typingText && (
            <View style={styles.typingContainer}>
              <Text textStyle={"Body_S1"} color={"blue600"}>
                {typingText}
              </Text>
            </View>
          )}
        </Navbar>

        <ChatView
          ref={chatRef}
          style={styles.chat}
          messages={nativeMessages}
          getActionsForMessage={getActionsForMessage}
          emojiReactions={["❤️", "👍", "😂", "😮", "😢", "🙏"]}
          inputAction={inputAction}
          hasMore={messageStore.messagesHolder.hasMore}
          hasNewer={messageStore.messagesHolder.hasNewer}
          isLoading={messageStore.messagesHolder.isBusy}
          isLoadingBottom={messageStore.messagesHolder.isLoadingNewer}
          theme={colorScheme === "dark" ? "dark" : "light"}
          topThreshold={200}
          bottomThreshold={200}
          scrollToBottomThreshold={150}
          collectionInsetTop={0}
          collectionInsetBottom={0}
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          onCancelInputAction={handleCancelInputAction}
          onReachTop={handleReachTop}
          onReachBottom={handleReachBottom}
          onMessagesVisible={handleMessagesVisible}
          onActionPress={handleActionPress}
          onEmojiReactionSelect={handleEmojiReaction}
          onReplyMessagePress={handleReplyMessagePress}
          onVideoPress={handleVideoPress}
          onPollOptionPress={handlePollOptionPress}
          onFilePress={handleFilePress}
        />
      </Col>
    );
  },
);

const styles = StyleSheet.create({
  chat: {
    flex: 1,
  },
  typingContainer: {
    position: "absolute",
    bottom: 0,
    left: 60,
    right: 60,
    alignItems: "center",
  },
});
