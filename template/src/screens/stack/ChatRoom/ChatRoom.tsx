import { toAbsoluteUrl } from "@api/Api.utils";
import {
  EChatType,
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
  type ChatAttachmentPressEventData,
  type ChatCancelInputActionEventData,
  type ChatEditMessageEventData,
  type ChatEmojiReactionSelectData,
  type ChatFilePressEventData,
  type ChatInputAction,
  type ChatMessage,
  type ChatMessagePressEventData,
  type ChatMessagesVisibleEventData,
  type ChatPollDetailPressEventData,
  type ChatPollOptionPressEventData,
  type ChatReachBottomEventData,
  type ChatReachTopEventData,
  type ChatReactionTapEventData,
  type ChatReplyMessagePressEventData,
  type ChatSendMessageEventData,
  type ChatVideoPressEventData,
  ChatView,
} from "@components/chatView";
import { ImageViewing } from "@components/imageViewing";
import { AttachmentPickerSheet } from "@components/shared/chat/AttachmentPickerSheet";
import { PollDetailModal } from "@components/shared/chat/PollDetailModal";
import { useTheme } from "@core";
import { iocHook } from "@di";
import { useRelativeTime } from "@hooks/useRelativeTime";
import { StackProps } from "@navigation";
import { usePresenceStore } from "@store";
import { IAuthStore } from "@store/auth";
import { useChatStore } from "@store/chat";
import { useFileUploadStore } from "@store/file/hooks";
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

const findAllAttachmentsByType = (
  attachments: MessageAttachmentDto[],
  prefix: string,
): MessageAttachmentDto[] =>
  attachments.filter(a => a.fileType.startsWith(prefix));

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
    selectedOptionIds:
      poll.userVotedOptionIds?.length > 0 ? poll.userVotedOptionIds : undefined,
    isMultipleChoice: poll.isMultipleChoice,
    isClosed: poll.isClosed,
  };
};

const mapMessageToNative = (
  msg: MessageDto,
  currentUserId?: string,
): ChatMessage => {
  const isMine = msg.senderId === currentUserId;

  const imageAttachments = findAllAttachmentsByType(msg.attachments, "image/");
  const videoAttachment = findAllAttachmentsByType(
    msg.attachments,
    "video/",
  )[0];
  const voiceAttachment = findAllAttachmentsByType(
    msg.attachments,
    "audio/",
  )[0];
  const fileAttachment = findFileAttachment(msg.attachments);

  // TODO: Rich text parsing — detect and mark up links, bold (**text**), and
  // code (`code`) in msg.content before sending to native. The native side
  // needs attributed string (iOS) / Spannable (Android) support, which is a
  // separate task. For now we pass plain text.

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
    forwardedFrom: msg.forwardedFromId
      ? msg.sender
        ? formatFullName(msg.sender.firstName, msg.sender.lastName)
        : "Forwarded"
      : undefined,

    // Multiple images
    images:
      imageAttachments.length > 0
        ? imageAttachments.map(a => ({
            url: toAbsoluteUrl(a.fileUrl) ?? a.fileUrl,
            width: a.width ?? undefined,
            height: a.height ?? undefined,
            thumbnailUrl: toAbsoluteUrl(a.thumbnailUrl ?? undefined),
          }))
        : undefined,

    video: videoAttachment
      ? {
          url:
            toAbsoluteUrl(videoAttachment.fileUrl) ?? videoAttachment.fileUrl,
          thumbnailUrl: toAbsoluteUrl(
            videoAttachment.thumbnailUrl ?? undefined,
          ),
          width: videoAttachment.width ?? undefined,
          height: videoAttachment.height ?? undefined,
          duration: videoAttachment.duration ?? undefined,
        }
      : undefined,

    voice: voiceAttachment
      ? {
          url:
            toAbsoluteUrl(voiceAttachment.fileUrl) ?? voiceAttachment.fileUrl,
          duration: voiceAttachment.duration ?? 0,
          waveform: voiceAttachment.waveform ?? undefined,
        }
      : undefined,

    poll: msg.poll ? mapPollToNative(msg.poll) : undefined,

    file: fileAttachment
      ? {
          url: toAbsoluteUrl(fileAttachment.fileUrl) ?? fileAttachment.fileUrl,
          name: fileAttachment.fileName,
          size: fileAttachment.fileSize,
          mimeType: fileAttachment.fileType,
        }
      : undefined,

    // Reactions with counts
    reactions:
      msg.reactions.length > 0
        ? msg.reactions.map(r => ({
            emoji: r.emoji,
            count: r.count,
            isMine: r.userIds.includes(currentUserId ?? ""),
          }))
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
    const presenceStore = usePresenceStore();
    const authStore = useAuthStore();
    const fileUploadStore = useFileUploadStore();
    const chatRef = useRef<ChatView>(null);
    const colorScheme = useColorScheme();

    const [inputAction, setInputAction] = useState<ChatInputAction | null>(
      null,
    );
    const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
    const [pollDetailId, setPollDetailId] = useState<string | null>(null);
    const [imageViewerIndex, setImageViewerIndex] = useState(-1);
    const [imageViewerImages, setImageViewerImages] = useState<
      { uri: string }[]
    >([]);

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

    const memberCount = chat?.members.length;
    const chatDisplayName = chatStore.chatModel?.displayName ?? "";
    const isDirect = chat?.type === EChatType.Direct;
    const peer = isDirect ? chat?.peer : undefined;
    const typingMap = messageStore.typingUsers;
    const userIds = Array.from(typingMap.keys());

    const lastOnlineRaw = peer
      ? presenceStore.getLastOnline(peer.userId) ?? peer.profile?.lastOnline
      : undefined;
    const lastOnlineFormatted = useRelativeTime(lastOnlineRaw);

    const typingUserNames = useMemo(() => {
      return Array.from(messageStore.typingUsers.keys());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messageStore.typingUsers, messageStore.typingUsers.size]);

    const typingCount = typingUserNames.length;
    const typingText =
      typingCount > 0
        ? isDirect
          ? "печатает..."
          : typingCount === 1
          ? (() => {
              const member = chat?.members.find(
                m => m.userId === typingUserNames[0],
              );
              const name = member?.profile
                ? [member.profile.firstName, member.profile.lastName]
                    .filter(Boolean)
                    .join(" ") || "Кто-то"
                : "Кто-то";

              return `${name} печатает...`;
            })()
          : typingCount <= 3
          ? "печатают..."
          : "несколько человек печатают..."
        : null;

    // Subtitle for header
    const subtitle = (() => {
      if (!isDirect) return `${memberCount} участников`;
      if (!peer) return "";

      if (presenceStore.isOnline(peer.userId)) return "в сети";

      if (lastOnlineFormatted) {
        return `был(а) в сети ${lastOnlineFormatted}`;
      }

      return "был(а) в сети недавно";
    })();

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

    const handleTyping = useCallback(
      (_?: { text: string }) => {
        chatStore.sendTyping(chatId);
      },
      [chatStore, chatId],
    );

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

    const handleReactionTap = useCallback(
      ({ emoji, messageId }: ChatReactionTapEventData) => {
        console.log("handleReactionTap", { emoji, messageId });
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

    const handlePollDetailPress = useCallback(
      ({ pollId }: ChatPollDetailPressEventData) => {
        setPollDetailId(pollId);
      },
      [],
    );

    const handleFilePress = useCallback(
      ({ fileUrl }: ChatFilePressEventData) => {
        Linking.openURL(fileUrl).catch(() => {
          Alert.alert("Error", "Cannot open file");
        });
      },
      [],
    );

    const handleMessagePress = useCallback(
      ({ messageId }: ChatMessagePressEventData) => {
        const msg = messages.find(m => m.id === messageId);

        if (!msg) return;

        const imageAttachments = findAllAttachmentsByType(
          msg.attachments,
          "image/",
        );

        if (imageAttachments.length > 0) {
          console.log(
            "1111",
            imageAttachments.map(a => ({ uri: toAbsoluteUrl(a.fileUrl)! })),
          );
          setImageViewerImages(
            imageAttachments.map(a => ({ uri: toAbsoluteUrl(a.fileUrl)! })),
          );
          setImageViewerIndex(0);
        }
      },
      [messages],
    );

    const handleGoBack = useCallback(() => {
      navigation.goBack();
    }, [navigation]);

    const handleChatInfo = useCallback(() => {
      (navigation as any).navigate("ChatInfo", { chatId });
    }, [navigation, chatId]);

    // ─── Attachment picker ──────────────────────────────────────────────────

    const handleAttachmentPress = useCallback(
      (_: ChatAttachmentPressEventData) => {
        setShowAttachmentPicker(true);
      },
      [],
    );

    const handleAttachmentPickerClose = useCallback(() => {
      setShowAttachmentPicker(false);
    }, []);

    const handleCameraPress = useCallback(() => {
      // TODO: integrate react-native-image-picker (launchCamera) once added to dependencies
      Alert.alert(
        "Camera",
        "Camera picker is not yet available. Add react-native-image-picker to enable.",
      );
    }, []);

    const handleGalleryPress = useCallback(() => {
      // TODO: integrate react-native-image-picker (launchImageLibrary) once added to dependencies
      Alert.alert(
        "Gallery",
        "Gallery picker is not yet available. Add react-native-image-picker to enable.",
      );
    }, []);

    const handleFilePickerPress = useCallback(() => {
      // TODO: integrate react-native-document-picker once added to dependencies
      Alert.alert(
        "File",
        "Document picker is not yet available. Add react-native-document-picker to enable.",
      );
    }, []);

    // ─── Voice recording ────────────────────────────────────────────────────

    const handleVoiceRecordingComplete = useCallback(
      async (event: { fileUrl: string; duration: number }) => {
        try {
          const { fileUrl } = event;
          const fileName = `voice_${Date.now()}.m4a`;

          // React Native FormData: { uri, type, name } — recognized by http-client
          const voiceFile = {
            uri: fileUrl,
            type: "audio/mp4",
            name: fileName,
          } as unknown as File;

          const uploaded = await fileUploadStore.upload(voiceFile);
          const fileIds = uploaded.map(f => f.id);

          await messageStore.sendMessage(chatId, {
            type: EMessageType.Voice,
            fileIds,
          });
        } catch (e) {
          console.log("e", e);
          Alert.alert("Error", "Failed to send voice message");
        }
      },
      [fileUploadStore, messageStore, chatId],
    );

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
      <Col flex={1}>
        <Navbar title={chatDisplayName} safeArea>
          <Navbar.BackButton onPress={handleGoBack} />
          <Navbar.Title onPress={handleChatInfo} />
          <Navbar.Subtitle>
            {typingText ? (
              <View style={styles.typingContainer}>
                <Text textStyle={"Body_S1"} color={"blue600"}>
                  {typingText}
                </Text>
              </View>
            ) : (
              <View style={styles.typingContainer}>
                <Text textStyle={"Body_S1"} color={"blue600"}>
                  {subtitle}
                </Text>
              </View>
            )}
          </Navbar.Subtitle>
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
          isLoadingTop={messageStore.messagesHolder.isLoadingMore}
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
          onPollDetailPress={handlePollDetailPress}
          onMessagePress={handleMessagePress}
          onFilePress={handleFilePress}
          onAttachmentPress={handleAttachmentPress}
          onVoiceRecordingComplete={handleVoiceRecordingComplete}
          onInputTyping={handleTyping}
          onReactionTap={handleReactionTap}
        />

        <AttachmentPickerSheet
          visible={showAttachmentPicker}
          onClose={handleAttachmentPickerClose}
          onCameraPress={handleCameraPress}
          onGalleryPress={handleGalleryPress}
          onFilePress={handleFilePickerPress}
        />

        <ImageViewing
          images={imageViewerImages}
          imageIndex={imageViewerIndex >= 0 ? imageViewerIndex : 0}
          visible={imageViewerIndex >= 0}
          onRequestClose={() => setImageViewerIndex(-1)}
        />

        {pollDetailId && (
          <PollDetailModal
            pollId={pollDetailId}
            messages={messages}
            onClose={() => setPollDetailId(null)}
          />
        )}
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
