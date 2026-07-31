import {
  EMessageStatus,
  EMessageType,
  MessageDto,
} from "@shared/api/gen/model";
import {
  type ChatAction,
  type ChatActionPressEventData,
  type ChatAttachmentPressEventData,
  type ChatCancelInputActionEventData,
  type ChatEditMessageEventData,
  type ChatEmojiReactionSelectData,
  type ChatInputAction,
  type ChatMessagePressEventData,
  type ChatPollDetailPressEventData,
  type ChatPollOptionPressEventData,
  type ChatReachBottomEventData,
  type ChatReachTopEventData,
  type ChatReactionTapEventData,
  type ChatReplyMessagePressEventData,
  type ChatScrollAnchorChangedEventData,
  type ChatSendMessageEventData,
  type ChatUnreadMessagesAppearEventData,
  ChatView,
  type ChatVisibleMessagesChangeEventData,
  ChatVoiceRecordingCompleteEventData,
} from "@shared/ui/chat-view";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Clipboard } from "react-native";

import {
  createMockMessages,
  MOCK_CURRENT_USER_ID,
  MOCK_PEER,
  nextMockId,
} from "./chat-mock-data";

/** Каждые ~14с на 2.5с показываем "печатает..." — просто чтобы показать индикатор. */
const TYPING_SIMULATION_INTERVAL_MS = 14_000;
const TYPING_SIMULATION_DURATION_MS = 2_500;

/**
 * Полностью локальный мок чата — без API и без сокета.
 * Существует исключительно для демонстрации нативного ChatView-компонента:
 * переписка, реакции, ответы, голосования по опросу и т.д. живут в стейте
 * этого хука и никуда не отправляются.
 */
export const useChatRoomMock = () => {
  const chatRef = useRef<ChatView>(null);

  const [messages, setMessages] = useState<MessageDto[]>(createMockMessages);
  const [inputAction, setInputAction] = useState<ChatInputAction | null>(null);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [pollDetailId, setPollDetailId] = useState<string | null>(null);
  const [imageViewerIndex, setImageViewerIndex] = useState(-1);
  const [imageViewerImages, setImageViewerImages] = useState<{ uri: string }[]>(
    [],
  );
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  // ── Типинг-индикатор для демонстрации (просто таймер, не сокет) ─────────

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPeerTyping(true);
      setTimeout(() => setIsPeerTyping(false), TYPING_SIMULATION_DURATION_MS);
    }, TYPING_SIMULATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // ── Header ────────────────────────────────────────────────────────

  const chatDisplayName = `${MOCK_PEER.firstName} ${MOCK_PEER.lastName}`;
  const typingText = isPeerTyping ? "печатает..." : null;
  const subtitle = "в сети";

  // ── Actions menu ──────────────────────────────────────────────────

  const getActionsForMessage = useCallback(
    (msg: { ownership?: string }): ChatAction[] => {
      if (msg.ownership === "system" || msg.ownership === "pinned") {
        return [{ id: "copy", title: "Copy", systemImage: "doc.on.doc" }];
      }

      const actions: ChatAction[] = [
        { id: "reply", title: "Reply", systemImage: "arrowshape.turn.up.left" },
        { id: "copy", title: "Copy", systemImage: "doc.on.doc" },
        {
          id: "forward",
          title: "Forward",
          systemImage: "arrowshape.turn.up.right",
        },
      ];

      if (msg.ownership === "mine") {
        actions.push({ id: "edit", title: "Edit", systemImage: "pencil" });
      }

      actions.push({ id: "pin", title: "Pin", systemImage: "pin" });
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

  // ── Message handlers ──────────────────────────────────────────────

  const handleSendMessage = useCallback(
    ({ text, replyToId }: ChatSendMessageEventData) => {
      const replyTo = replyToId
        ? messages.find(m => m.id === replyToId)
        : undefined;

      const now = new Date().toISOString();

      setMessages(prev => [
        ...prev,
        {
          id: nextMockId(),
          chatId: "demo-chat",
          senderId: MOCK_CURRENT_USER_ID,
          type: EMessageType.text,
          status: EMessageStatus.sent,
          content: text,
          replyToId: replyToId ?? null,
          replyTo: replyTo ?? null,
          forwardedFromId: null,
          isEdited: false,
          isDeleted: false,
          isPinned: false,
          pinnedAt: null,
          pinnedById: null,
          keyboard: null,
          createdAt: now,
          updatedAt: now,
          attachments: [],
          reactions: [],
          mentions: [],
        },
      ]);
      setInputAction(null);

      // Имитация delivered/read — чисто визуально, без сети.
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.status === EMessageStatus.sent
              ? { ...m, status: EMessageStatus.delivered }
              : m,
          ),
        );
      }, 600);
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.status === EMessageStatus.delivered
              ? { ...m, status: EMessageStatus.read }
              : m,
          ),
        );
      }, 1600);
    },
    [messages],
  );

  const handleEditMessage = useCallback(
    ({ text, messageId }: ChatEditMessageEventData) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, content: text, isEdited: true } : m,
        ),
      );
      setInputAction(null);
    },
    [],
  );

  const handleCancelInputAction = useCallback(
    (_: ChatCancelInputActionEventData) => {
      setInputAction(null);
    },
    [],
  );

  const handleTyping = useCallback((_?: { text: string }) => {
    // Локальный мок — печать текущего пользователя никуда не отправляется.
  }, []);

  // ── Scrolling / pagination (мок — история не подгружается) ────────

  const handleReachTop = useCallback((_: ChatReachTopEventData) => {}, []);
  const handleReachBottom = useCallback(
    (_: ChatReachBottomEventData) => {},
    [],
  );
  const handleVisibleMessagesChange = useCallback(
    (_: ChatVisibleMessagesChangeEventData) => {},
    [],
  );
  const handleUnreadMessagesAppear = useCallback(
    (_: ChatUnreadMessagesAppearEventData) => {},
    [],
  );

  // ── Action press ──────────────────────────────────────────────────

  const handleActionPress = useCallback(
    ({ actionId, messageId }: ChatActionPressEventData) => {
      const msg = messages.find(m => m.id === messageId);

      switch (actionId) {
        case "reply":
          setInputAction({ type: "reply", messageId });
          break;
        case "edit":
          if (msg?.senderId !== MOCK_CURRENT_USER_ID) {
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
          break;
        case "pin":
          if (msg) {
            setMessages(prev =>
              prev.map(m =>
                m.id === messageId ? { ...m, isPinned: !m.isPinned } : m,
              ),
            );
          }
          break;
        case "delete":
          Alert.alert("Delete message", "How do you want to delete?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete for me",
              onPress: () =>
                setMessages(prev => prev.filter(m => m.id !== messageId)),
            },
            {
              text: "Delete for all",
              style: "destructive",
              onPress: () =>
                setMessages(prev => prev.filter(m => m.id !== messageId)),
            },
          ]);
          break;
      }
    },
    [messages],
  );

  // ── Reactions ─────────────────────────────────────────────────────

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId) return m;

        const existing = m.reactions.find(r => r.emoji === emoji);
        const hasMine = existing?.userIds.includes(MOCK_CURRENT_USER_ID);

        if (hasMine) {
          const userIds = existing!.userIds.filter(
            id => id !== MOCK_CURRENT_USER_ID,
          );

          return {
            ...m,
            reactions:
              userIds.length > 0
                ? m.reactions.map(r =>
                    r.emoji === emoji
                      ? { ...r, userIds, count: userIds.length }
                      : r,
                  )
                : m.reactions.filter(r => r.emoji !== emoji),
          };
        }

        if (existing) {
          const userIds = [...existing.userIds, MOCK_CURRENT_USER_ID];

          return {
            ...m,
            reactions: m.reactions.map(r =>
              r.emoji === emoji ? { ...r, userIds, count: userIds.length } : r,
            ),
          };
        }

        return {
          ...m,
          reactions: [
            ...m.reactions,
            { emoji, userIds: [MOCK_CURRENT_USER_ID], count: 1 },
          ],
        };
      }),
    );
  }, []);

  const handleEmojiReaction = useCallback(
    ({ emoji, messageId }: ChatEmojiReactionSelectData) => {
      toggleReaction(messageId, emoji);
    },
    [toggleReaction],
  );

  const handleReactionTap = useCallback(
    ({ emoji, messageId }: ChatReactionTapEventData) => {
      toggleReaction(messageId, emoji);
    },
    [toggleReaction],
  );

  // ── Reply press ───────────────────────────────────────────────────

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

  // ── Polls ─────────────────────────────────────────────────────────

  const handlePollOptionPress = useCallback(
    ({ pollId, optionId }: ChatPollOptionPressEventData) => {
      setMessages(prev =>
        prev.map(m => {
          if (!m.poll || m.poll.id !== pollId) return m;

          const alreadyVoted = m.poll.userVotedOptionIds.includes(optionId);
          const options = m.poll.options.map(o => {
            if (o.id !== optionId) return o;

            return {
              ...o,
              voterCount: alreadyVoted
                ? Math.max(0, o.voterCount - 1)
                : o.voterCount + 1,
            };
          });

          return {
            ...m,
            poll: {
              ...m.poll,
              options,
              userVotedOptionIds: alreadyVoted ? [] : [optionId],
              totalVotes: options.reduce((sum, o) => sum + o.voterCount, 0),
            },
          };
        }),
      );
    },
    [],
  );

  const handlePollDetailPress = useCallback(
    ({ pollId }: ChatPollDetailPressEventData) => {
      setPollDetailId(pollId);
    },
    [],
  );

  // ── Message press (image viewer) ──────────────────────────────────

  const handleMessagePress = useCallback(
    ({ messageId }: ChatMessagePressEventData) => {
      const msg = messages.find(m => m.id === messageId);

      if (!msg) return;

      const imageAttachments = msg.attachments.filter(a =>
        a.fileType.startsWith("image/"),
      );

      if (imageAttachments.length > 0) {
        setImageViewerImages(imageAttachments.map(a => ({ uri: a.fileUrl })));
        setImageViewerIndex(0);
      }
    },
    [messages],
  );

  // ── Scroll anchor / FAB — мок без персистентности ──────────────────

  const handleScrollAnchorChanged = useCallback(
    (_: ChatScrollAnchorChangedEventData) => {},
    [],
  );

  const handleFabPress = useCallback(() => {
    chatRef.current?.scrollToBottom();
  }, []);

  // ── Attachments ───────────────────────────────────────────────────

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
    Alert.alert("Camera", "Camera picker is not yet available.");
  }, []);

  const handleGalleryPress = useCallback(() => {
    Alert.alert("Gallery", "Gallery picker is not yet available.");
  }, []);

  const handleFilePickerPress = useCallback(() => {
    Alert.alert("File", "Document picker is not yet available.");
  }, []);

  // ── Voice recording ───────────────────────────────────────────────

  const handleVoiceRecordingComplete = useCallback(
    (event: ChatVoiceRecordingCompleteEventData) => {
      const { fileUrl, duration, waveform } = event;
      const now = new Date().toISOString();

      setMessages(prev => [
        ...prev,
        {
          id: nextMockId(),
          chatId: "demo-chat",
          senderId: MOCK_CURRENT_USER_ID,
          type: EMessageType.voice,
          status: EMessageStatus.sent,
          content: null,
          replyToId: null,
          forwardedFromId: null,
          isEdited: false,
          isDeleted: false,
          isPinned: false,
          pinnedAt: null,
          pinnedById: null,
          keyboard: null,
          createdAt: now,
          updatedAt: now,
          attachments: [
            {
              id: nextMockId(),
              fileId: nextMockId(),
              fileName: `voice_${Date.now()}.m4a`,
              fileUrl,
              fileType: "audio/m4a",
              fileSize: 0,
              thumbnailUrl: null,
              width: null,
              height: null,
              duration,
              waveform: waveform ?? null,
            },
          ],
          reactions: [],
          mentions: [],
        },
      ]);
    },
    [],
  );

  return {
    // Header
    chatDisplayName,
    typingText,
    isRefreshing: false,
    subtitle,

    // Data
    messages,
    currentUserId: MOCK_CURRENT_USER_ID,
    chatRef,

    // State
    inputAction,
    showAttachmentPicker,
    pollDetailId,
    imageViewerIndex,
    imageViewerImages,
    isGroupChat: false,
    isReturningToLatest: false,
    hasMore: false,
    hasNewer: false,
    unreadCount: 0,

    // Setters
    setPollDetailId,
    setImageViewerIndex,

    // Handlers
    getActionsForMessage,
    handleSendMessage,
    handleEditMessage,
    handleCancelInputAction,
    handleTyping,
    handleReachTop,
    handleReachBottom,
    handleVisibleMessagesChange,
    handleUnreadMessagesAppear,
    handleActionPress,
    handleEmojiReaction,
    handleReactionTap,
    handleReplyMessagePress,
    handlePollOptionPress,
    handlePollDetailPress,
    handleMessagePress,
    handleAttachmentPress,
    handleAttachmentPickerClose,
    handleCameraPress,
    handleGalleryPress,
    handleFilePickerPress,
    handleVoiceRecordingComplete,
    handleFabPress,
    handleScrollAnchorChanged,
  };
};
