import {
  EMessageStatus,
  EMessageType,
  MessageDto,
} from "@shared/api/gen/model";

/** Демо-собеседник — чат полностью локальный, без бэкенда. */
export const MOCK_PEER = {
  id: "peer-1",
  firstName: "Алиса",
  lastName: "Иванова",
  avatarUrl: undefined as string | undefined,
};

export const MOCK_CURRENT_USER_ID = "me";

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

let idCounter = 1000;

export const nextMockId = () => String(idCounter++);

const baseMessage = (
  overrides: Partial<MessageDto> & Pick<MessageDto, "senderId" | "createdAt">,
): MessageDto => ({
  id: nextMockId(),
  chatId: "demo-chat",
  type: EMessageType.text,
  status: EMessageStatus.read,
  content: null,
  replyToId: null,
  forwardedFromId: null,
  isEdited: false,
  isDeleted: false,
  isPinned: false,
  pinnedAt: null,
  pinnedById: null,
  keyboard: null,
  updatedAt: overrides.createdAt,
  attachments: [],
  reactions: [],
  mentions: [],
  sender:
    overrides.senderId === MOCK_PEER.id
      ? {
          id: MOCK_PEER.id,
          firstName: MOCK_PEER.firstName,
          lastName: MOCK_PEER.lastName,
          avatarUrl: MOCK_PEER.avatarUrl,
        }
      : undefined,
  ...overrides,
});

/** Стартовая переписка — демонстрирует текст, картинку, голосовое и опрос. */
export const createMockMessages = (): MessageDto[] => {
  const pollId = nextMockId();

  const pollMessage = baseMessage({
    id: pollId,
    senderId: MOCK_PEER.id,
    createdAt: minutesAgo(15),
    type: EMessageType.poll,
    poll: {
      id: pollId,
      messageId: pollId,
      question: "Го в кино на выходных?",
      isAnonymous: false,
      isMultipleChoice: false,
      isClosed: false,
      closedAt: null,
      options: [
        {
          id: "opt-1",
          text: "Сб вечером",
          position: 0,
          voterCount: 3,
          voterIds: [],
        },
        {
          id: "opt-2",
          text: "Вс днём",
          position: 1,
          voterCount: 1,
          voterIds: [],
        },
        {
          id: "opt-3",
          text: "Не в этот раз",
          position: 2,
          voterCount: 0,
          voterIds: [],
        },
      ],
      totalVotes: 4,
      userVotedOptionIds: [],
      createdAt: minutesAgo(15),
      updatedAt: minutesAgo(15),
    },
  });

  return [
    baseMessage({
      senderId: MOCK_PEER.id,
      createdAt: minutesAgo(42),
      content: "Привет! Как тебе новый нативный чат?",
    }),
    baseMessage({
      senderId: MOCK_CURRENT_USER_ID,
      createdAt: minutesAgo(40),
      content: "Летает! Прямо на нативных iOS/Android компонентах 🚀",
    }),
    baseMessage({
      senderId: MOCK_PEER.id,
      createdAt: minutesAgo(35),
      type: EMessageType.image,
      attachments: [
        {
          id: nextMockId(),
          fileId: nextMockId(),
          fileName: "demo.jpg",
          fileUrl: "https://picsum.photos/seed/rnapp-chat/900/600",
          fileType: "image/jpeg",
          fileSize: 240_000,
          thumbnailUrl: "https://picsum.photos/seed/rnapp-chat/200/140",
          width: 900,
          height: 600,
          duration: null,
          waveform: null,
        },
      ],
    }),
    baseMessage({
      senderId: MOCK_CURRENT_USER_ID,
      createdAt: minutesAgo(28),
      type: EMessageType.voice,
      attachments: [
        {
          id: nextMockId(),
          fileId: nextMockId(),
          fileName: "voice.m4a",
          fileUrl:
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          fileType: "audio/m4a",
          fileSize: 48_000,
          thumbnailUrl: null,
          width: null,
          height: null,
          duration: 12,
          waveform: [2, 6, 10, 4, 8, 12, 6, 3, 9, 11, 5, 2, 7, 10, 4],
        },
      ],
    }),
    pollMessage,
    baseMessage({
      senderId: MOCK_CURRENT_USER_ID,
      createdAt: minutesAgo(3),
      content: "Отвечу в опросе 👆",
      replyToId: pollId,
      replyTo: pollMessage,
    }),
  ];
};
