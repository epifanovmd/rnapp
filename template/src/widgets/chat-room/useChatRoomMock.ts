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
  type ChatFeatures,
  type ChatInputAction,
  type ChatInputTypingEventData,
  type ChatLinkTapEventData,
  type ChatMessage,
  type ChatMessagePressEventData,
  type ChatPhoneNumberTapEventData,
  type ChatPollDetailPressEventData,
  type ChatPollOptionPressEventData,
  type ChatReachBottomEventData,
  type ChatReachTopEventData,
  type ChatReactionTapEventData,
  type ChatReplyMessagePressEventData,
  type ChatScrollAnchorChangedEventData,
  type ChatScrollEventData,
  type ChatSendMessageEventData,
  type ChatThreadTapEventData,
  type ChatUnreadMessagesAppearEventData,
  ChatView,
  type ChatVisibleMessagesChangeEventData,
  ChatVoiceRecordingCompleteEventData,
  type IChatScrollAnchor,
} from "@shared/ui/chat-view";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Clipboard } from "react-native";

import {
  createMockMessages,
  MOCK_CURRENT_USER_ID,
  MOCK_PEER,
  nextMockId,
} from "./chat-mock-data";
import { mapMessageToNative } from "./native/map-message-to-native";

/** Каждые ~14с на 2.5с показываем "печатает..." — просто чтобы показать индикатор. */
const TYPING_SIMULATION_INTERVAL_MS = 14_000;
const TYPING_SIMULATION_DURATION_MS = 2_500;

/** Эмодзи быстрых реакций в контекстном меню. Стабильная ссылка — ломает memo на ChatView. */

/** Лог всех колбэков чата для тестирования: тег + имя события + данные. */
const TAG = "[ChatRoomMock]";

const logEvent = (name: string, payload?: unknown) => {
  console.log(TAG, name, payload ?? "");
};

const EMOJI_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

/** Начальные настройки чата — их переключает модалка с шестерёнкой. */
const DEFAULT_FEATURES: ChatFeatures = {
  senderNameMode: "always",
  showMessageStatus: true,
  showTimestamp: true,
  showEditedMark: true,
  showReactions: true,
  showReplyPreview: true,
  showForwardedMark: true,
  showThreadIndicator: true,
  showAvatars: true,
  linkDetectionEnabled: true,
  showFab: true,
  showFloatingDate: true,
  showDateSeparators: true,
  showTopLoadingIndicator: true,
  showBottomLoadingIndicator: true,
  showEmptyState: true,
  showInputBar: true,
  showAttachButton: true,
  showVoiceRecording: true,
  contextMenuEnabled: true,
  autoScrollOnNewMessage: true,
  emojiReactions: EMOJI_REACTIONS,
  topLoadThreshold: 400,
  bottomLoadThreshold: 400,
  scrollToBottomThreshold: 150,
  disintegrationEnabled: true,
};

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
  const [chatFeatures, setChatFeatures] =
    useState<ChatFeatures>(DEFAULT_FEATURES);

  // ── Настройки чата ──────────────────────────────────────────────────

  const updateFeature = useCallback(
    (patch: Partial<ChatFeatures>) =>
      setChatFeatures(prev => ({ ...prev, ...patch })),
    [],
  );

  // ── Нативные сообщения с сохранением идентичности ───────────────────────

  // `setMessages` пересоздаёт только изменённый DTO (`.map`/`.filter`), и по
  // этой идентичности кешируется результат `mapMessageToNative`. Иначе на
  // голос в опросе или удаление одного сообщения заново мапились бы все
  // тысяча сообщений, и чат перерисовал бы каждую ячейку.
  const nativeMessagesCacheRef = useRef(new Map<MessageDto, ChatMessage>());

  const nativeMessages = useMemo(() => {
    const cache = nativeMessagesCacheRef.current;

    return messages.map(message => {
      let mapped = cache.get(message);

      if (!mapped) {
        mapped = mapMessageToNative(message, MOCK_CURRENT_USER_ID);
        cache.set(message, mapped);
      }

      return mapped;
    });
  }, [messages]);

  // ── Начальная позиция: демо открывается с середины переписки ─────────────

  // Якорь берётся один раз на первом рендере: чат читает его только в момент
  // монтирования (`useChatInitialScroll`). Среднее сообщение в исходном
  // массиве ≈ середина по времени, поэтому чат стартует с середины списка,
  // а не с конца (как в реальном мессенджере с восстановлением позиции).
  const initialScrollAnchorRef = useRef<IChatScrollAnchor | undefined>(
    undefined,
  );

  if (initialScrollAnchorRef.current === undefined && messages.length > 0) {
    const mid = messages[Math.floor(messages.length / 2)];

    // Восстановление якоря идёт как в эталоне (нативная реализация):
    // выравнивание по низу — среднее сообщение оказывается у нижнего края
    // вьюпорта, сверху видна более ранняя часть переписки.
    initialScrollAnchorRef.current = {
      messageId: mid.id,
      offset: 0,
      wasAtBottom: false,
    };
  }

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
      logEvent("onSendMessage", { text, replyToId });

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
      logEvent("onEditMessage", { text, messageId });

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
    (payload: ChatCancelInputActionEventData) => {
      logEvent("onCancelInputAction", payload);
      setInputAction(null);
    },
    [],
  );

  const handleTyping = useCallback((payload: ChatInputTypingEventData) => {
    logEvent("onInputTyping", payload);
    // Локальный мок — печать текущего пользователя никуда не отправляется.
  }, []);

  // ── Scrolling / pagination (мок — история не подгружается) ────────

  const handleScroll = useCallback((event: ChatScrollEventData) => {
    // Самый частый колбэк — идёт на каждый скролл (throttle ~30мс).
    logEvent("onScroll", event);
  }, []);

  const handleReachTop = useCallback((payload: ChatReachTopEventData) => {
    logEvent("onReachTop", payload);
  }, []);
  const handleReachBottom = useCallback((payload: ChatReachBottomEventData) => {
    logEvent("onReachBottom", payload);
  }, []);
  const handleVisibleMessagesChange = useCallback(
    (payload: ChatVisibleMessagesChangeEventData) => {
      logEvent("onVisibleMessagesChange", payload);
    },
    [],
  );
  const handleUnreadMessagesAppear = useCallback(
    (payload: ChatUnreadMessagesAppearEventData) => {
      logEvent("onUnreadMessagesAppear", payload);
    },
    [],
  );

  // ── Action press ──────────────────────────────────────────────────

  const handleActionPress = useCallback(
    ({ actionId, messageId }: ChatActionPressEventData) => {
      logEvent("onActionPress", { actionId, messageId });

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
      logEvent("onEmojiReactionSelect", { emoji, messageId });
      toggleReaction(messageId, emoji);
    },
    [toggleReaction],
  );

  const handleReactionTap = useCallback(
    ({ emoji, messageId }: ChatReactionTapEventData) => {
      logEvent("onReactionTap", { emoji, messageId });
      toggleReaction(messageId, emoji);
    },
    [toggleReaction],
  );

  // ── Reply press ───────────────────────────────────────────────────

  const handleReplyMessagePress = useCallback(
    ({ messageId }: ChatReplyMessagePressEventData) => {
      logEvent("onReplyMessagePress", { messageId });
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
      logEvent("onPollOptionPress", { pollId, optionId });

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
      logEvent("onPollDetailPress", { pollId });
      setPollDetailId(pollId);
    },
    [],
  );

  // ── Message press (image viewer) ──────────────────────────────────

  const handleMessagePress = useCallback(
    ({ messageId, attachmentIndex }: ChatMessagePressEventData) => {
      logEvent("onMessagePress", { messageId, attachmentIndex });

      const msg = messages.find(m => m.id === messageId);

      if (!msg) return;

      const imageAttachments = msg.attachments.filter(a =>
        a.fileType.startsWith("image/"),
      );

      if (imageAttachments.length > 0) {
        setImageViewerImages(imageAttachments.map(a => ({ uri: a.fileUrl })));
        // Открываем именно то вложение, по которому тапнули: индекс приходит
        // из сетки медиа. Тап по самому пузырю индекса не несёт — тогда первое.
        setImageViewerIndex(
          attachmentIndex != null && attachmentIndex < imageAttachments.length
            ? attachmentIndex
            : 0,
        );
      }
    },
    [messages],
  );

  // ── Thread / link / phone taps ────────────────────────────────────

  const handleThreadTap = useCallback(
    ({ messageId, threadId }: ChatThreadTapEventData) => {
      logEvent("onThreadTap", { messageId, threadId });
    },
    [],
  );

  const handleLinkTap = useCallback(
    ({ url, messageId }: ChatLinkTapEventData) => {
      logEvent("onLinkTap", { url, messageId });
    },
    [],
  );

  const handlePhoneNumberTap = useCallback(
    ({ phoneNumber, messageId }: ChatPhoneNumberTapEventData) => {
      logEvent("onPhoneNumberTap", { phoneNumber, messageId });
    },
    [],
  );

  // ── Scroll anchor / FAB — мок без персистентности ──────────────────

  const handleScrollAnchorChanged = useCallback(
    (payload: ChatScrollAnchorChangedEventData) => {
      logEvent("onScrollAnchorChanged", payload);
    },
    [],
  );

  const handleFabPress = useCallback(() => {
    logEvent("onFabPress");
    chatRef.current?.scrollToBottom();
  }, []);

  // ── Attachments ───────────────────────────────────────────────────

  const handleAttachmentPress = useCallback(
    (payload: ChatAttachmentPressEventData) => {
      logEvent("onAttachmentPress", payload);
      setShowAttachmentPicker(true);
    },
    [],
  );

  const handleAttachmentPickerClose = useCallback(() => {
    logEvent("onAttachmentPickerClose");
    setShowAttachmentPicker(false);
  }, []);

  const handleCameraPress = useCallback(() => {
    logEvent("attachmentPicker.camera");
    Alert.alert("Camera", "Camera picker is not yet available.");
  }, []);

  const handleGalleryPress = useCallback(() => {
    logEvent("attachmentPicker.gallery");
    Alert.alert("Gallery", "Gallery picker is not yet available.");
  }, []);

  const handleFilePickerPress = useCallback(() => {
    logEvent("attachmentPicker.file");
    Alert.alert("File", "Document picker is not yet available.");
  }, []);

  // ── Voice recording ───────────────────────────────────────────────

  const handleVoiceRecordingComplete = useCallback(
    (event: ChatVoiceRecordingCompleteEventData) => {
      const { fileUrl, duration, waveform } = event;

      logEvent("onVoiceRecordingComplete", { fileUrl, duration, waveform });

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
    nativeMessages,
    initialScrollAnchor: initialScrollAnchorRef.current,
    currentUserId: MOCK_CURRENT_USER_ID,
    chatRef,

    // Features / settings
    chatFeatures,
    updateFeature,

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
    handleScroll,
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
    handleThreadTap,
    handleLinkTap,
    handlePhoneNumberTap,
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
