import {
  EMessageStatus,
  EMessageType,
  MessageDto,
} from "@shared/api/gen/model";
import { IStorageService } from "@shared/lib/storage";
import {
  type ChatAction,
  type ChatInputAction,
  type ChatMessage,
  ChatView,
  type ChatVoiceRecording,
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
import { createChatScrollStorage } from "./chat-scroll-storage";
import { mapMessageToChat } from "./model/map-message-to-chat";

/** Демо-чат один, но ключ хранения всё равно привязан к нему. */
const MOCK_CHAT_ID = "demo-chat";

/** Каждые ~14с на 2.5с показываем "печатает..." — просто чтобы показать индикатор. */
const TYPING_SIMULATION_INTERVAL_MS = 14_000;
const TYPING_SIMULATION_DURATION_MS = 2_500;

/** Лог всех колбэков чата для тестирования: тег + имя события + данные. */
const TAG = "[ChatRoomMock]";

const logEvent = (name: string, payload?: unknown) => {
  console.log(TAG, name, payload ?? "");
};

/**
 * Полностью локальный мок чата — без API и без сокета.
 * Существует исключительно для демонстрации компонента ChatView: переписка,
 * реакции, ответы, голосования по опросу и т.д. живут в стейте этого хука и
 * никуда не отправляются.
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

  // ── Сообщения чата с сохранением идентичности ─────────────────────────

  // `setMessages` пересоздаёт только изменённый DTO (`.map`/`.filter`), и по
  // этой идентичности кешируется результат `mapMessageToChat`. Иначе на
  // голос в опросе или удаление одного сообщения заново мапились бы все
  // тысяча сообщений, и чат перерисовал бы каждую ячейку.
  const chatMessagesCacheRef = useRef(new Map<MessageDto, ChatMessage>());

  const chatMessages = useMemo(() => {
    const cache = chatMessagesCacheRef.current;

    return messages.map(message => {
      let mapped = cache.get(message);

      if (!mapped) {
        mapped = mapMessageToChat(message, MOCK_CURRENT_USER_ID);
        cache.set(message, mapped);
      }

      return mapped;
    });
  }, [messages]);

  // ── Начальная позиция: восстановление сохранённого якоря ────────────────

  const storage = IStorageService.useInstance();
  const scrollStorage = useRef(createChatScrollStorage(storage)).current;

  const [isScrollRestoreEnabled, setIsScrollRestoreEnabled] = useState(() =>
    scrollStorage.isRestoreEnabled(),
  );

  // Якорь читается ровно один раз, на первом рендере: чат берёт
  // `initialScrollAnchor` только в момент монтирования. MMKV синхронный,
  // поэтому значение доступно уже здесь — без мигания «сначала низ, потом
  // прыжок к позиции».
  const initialScrollAnchorRef = useRef<IChatScrollAnchor | undefined>(
    undefined,
  );
  const didReadAnchorRef = useRef(false);

  if (!didReadAnchorRef.current) {
    didReadAnchorRef.current = true;

    const stored = isScrollRestoreEnabled
      ? scrollStorage.readAnchor(MOCK_CHAT_ID)
      : undefined;

    // Якорь на несуществующее сообщение чат отрабатывает молча — просто
    // открывается в конце. Отличить «нечего восстанавливать» от «якорь есть,
    // но сообщение потерялось» иначе невозможно, поэтому проверяем здесь.
    if (stored && !messages.some(message => message.id === stored.messageId)) {
      logEvent("scrollAnchor: сообщение не найдено, откроем в конце", stored);
      scrollStorage.clearAnchor(MOCK_CHAT_ID);
    } else {
      initialScrollAnchorRef.current = stored;
    }
  }

  const handleScrollRestoreToggle = useCallback(
    (enabled: boolean) => {
      setIsScrollRestoreEnabled(enabled);
      scrollStorage.setRestoreEnabled(enabled);

      // Выключили — забываем сохранённое, иначе оно всплывёт при повторном
      // включении и покажет позицию из прошлой жизни.
      if (!enabled) scrollStorage.clearAnchor(MOCK_CHAT_ID);
    },
    [scrollStorage],
  );
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
    (text: string, replyToId?: string) => {
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

  const handleEditMessage = useCallback((text: string, messageId: string) => {
    logEvent("onEditMessage", { text, messageId });

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId ? { ...m, content: text, isEdited: true } : m,
      ),
    );
    setInputAction(null);
  }, []);

  const handleCancelInputAction = useCallback((type: string) => {
    logEvent("onCancelInputAction", type);
    setInputAction(null);
  }, []);

  const handleTyping = useCallback((text: string) => {
    logEvent("onInputTyping", text);
    // Локальный мок — печать текущего пользователя никуда не отправляется.
  }, []);

  // ── Scrolling / pagination (мок — история не подгружается) ────────

  const handleScroll = useCallback((offsetY: number, isAtBottom: boolean) => {
    // Самый частый колбэк — идёт на каждый скролл (throttle ~30мс).
    logEvent("onScroll", { offsetY, isAtBottom });
  }, []);

  const handleReachTop = useCallback(() => {
    logEvent("onReachTop");
  }, []);
  const handleReachBottom = useCallback(() => {
    logEvent("onReachBottom");
  }, []);
  const handleVisibleMessagesChange = useCallback(
    (messageIds: string[], isAtBottom: boolean) => {
      logEvent("onVisibleMessagesChange", { messageIds, isAtBottom });
    },
    [],
  );
  const handleUnreadMessagesAppear = useCallback((messageIds: string[]) => {
    logEvent("onUnreadMessagesAppear", messageIds);
  }, []);

  // ── Action press ──────────────────────────────────────────────────

  const handleActionPress = useCallback(
    (actionId: string, messageId: string) => {
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
    (emoji: string, messageId: string) => {
      logEvent("onEmojiReactionSelect", { emoji, messageId });
      toggleReaction(messageId, emoji);
    },
    [toggleReaction],
  );

  const handleReactionTap = useCallback(
    (emoji: string, messageId: string) => {
      logEvent("onReactionTap", { emoji, messageId });
      toggleReaction(messageId, emoji);
    },
    [toggleReaction],
  );

  // ── Reply press ───────────────────────────────────────────────────

  const handleReplyMessagePress = useCallback((messageId: string) => {
    logEvent("onReplyMessagePress", { messageId });
    chatRef.current?.scrollToMessage(messageId, {
      position: "center",
      animated: true,
      highlight: true,
    });
  }, []);

  // ── Polls ─────────────────────────────────────────────────────────

  const handlePollOptionPress = useCallback(
    (messageId: string, pollId: string, optionId: string) => {
      logEvent("onPollOptionPress", { messageId, pollId, optionId });

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
    (messageId: string, pollId: string) => {
      logEvent("onPollDetailPress", { messageId, pollId });
      setPollDetailId(pollId);
    },
    [],
  );

  // ── Message press (image viewer) ──────────────────────────────────

  const handleMessagePress = useCallback(
    (messageId: string, attachmentIndex?: number) => {
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

  const handleThreadTap = useCallback((messageId: string, threadId: string) => {
    logEvent("onThreadTap", { messageId, threadId });
  }, []);

  const handleLinkTap = useCallback((url: string, messageId: string) => {
    logEvent("onLinkTap", { url, messageId });
  }, []);

  const handlePhoneNumberTap = useCallback(
    (phoneNumber: string, messageId: string) => {
      logEvent("onPhoneNumberTap", { phoneNumber, messageId });
    },
    [],
  );

  // ── Scroll anchor / FAB — мок без персистентности ──────────────────

  const handleScrollAnchorChanged = useCallback(
    (anchor: IChatScrollAnchor) => {
      const msg = messages.find(m => m.id === anchor.messageId);

      logEvent(
        "onScrollAnchorChanged",
        [anchor.messageId, anchor.offset, msg?.content].join("\t"),
      );

      if (!isScrollRestoreEnabled) return;

      // Чат уже троттлит это событие (~300 мс) и шлёт его только при
      // пользовательском скролле, поэтому пишем как есть — MMKV синхронный
      // и дешёвый, дополнительный дебаунс тут ничего не даст.
      scrollStorage.writeAnchor(MOCK_CHAT_ID, anchor);
    },
    [isScrollRestoreEnabled, messages, scrollStorage],
  );

  const handleFabPress = useCallback(() => {
    logEvent("onFabPress");
    chatRef.current?.scrollToBottom();
  }, []);

  // ── Attachments ───────────────────────────────────────────────────

  const handleAttachmentPress = useCallback(() => {
    logEvent("onAttachmentPress");
    setShowAttachmentPicker(true);
  }, []);

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
    ({ fileUrl, duration, waveform }: ChatVoiceRecording) => {
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
    chatMessages,
    initialScrollAnchor: initialScrollAnchorRef.current,
    currentUserId: MOCK_CURRENT_USER_ID,
    chatRef,

    // Features / settings
    isScrollRestoreEnabled,
    onScrollRestoreToggle: handleScrollRestoreToggle,

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
