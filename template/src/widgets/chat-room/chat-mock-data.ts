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

/** Размер демо-переписки — стресс-тест списка на тысяче сообщений. */
export const MOCK_MESSAGES_TOTAL = 1000;

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

// ─── Детерминированный генератор ────────────────────────────────────────────
// Одинаковая переписка при каждом запуске: иначе нативную и RN-реализации
// нельзя сравнивать бок о бок.

const createRandom = (seed: number) => {
  const modulus = 2147483647;
  let state = seed % modulus;

  if (state <= 0) state += modulus - 1;

  return () => {
    state = (state * 16807) % modulus;

    return (state - 1) / modulus;
  };
};

type Random = () => number;

const pick = <T>(random: Random, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)];

const int = (random: Random, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));

const chance = (random: Random, probability: number) => random() < probability;

// ─── Тексты ─────────────────────────────────────────────────────────────────

const OPENERS = [
  "Кстати",
  "Слушай",
  "Смотри",
  "Короче",
  "В общем",
  "Похоже",
  "Думаю",
  "Кажется",
  "Честно говоря",
  "По-моему",
  "Прикинь",
  "Между прочим",
] as const;

const BODIES = [
  "получилось ускорить прокрутку списка",
  "поправил разметку пузырей",
  "перенёс контекстное меню в shared/ui",
  "надо будет пересобрать поды",
  "тесты на диффе наконец зелёные",
  "волна в голосовых теперь нормализуется",
  "дизайн просил увеличить отступы",
  "на слабых устройствах всё ещё лагает при вставке сверху",
  "релиз перенесли на следующую неделю",
  "я закинул макеты в фигму",
  "клавиатура больше не прыгает при открытии меню",
  "с якорем скролла разобрались",
  "аватарки теперь липнут к низу группы",
  "надо добавить пустое состояние для архива",
  "проверь пожалуйста на своём телефоне",
  "бэкенд обещает эндпоинт к пятнице",
] as const;

const ENDINGS = ["", ".", "!", "?", " 🙂", " 👌", " 🔥", ", ок?"] as const;

const LONG_TEXTS = [
  "Расписал всё по шагам: сначала считаем высоту ячейки без учёта реакций, " +
    "потом добавляем строки чипов, и только после этого прибавляем футер. " +
    "Иначе при обновлении реакций высота скачет и список дёргается.",
  "Проблема была в том, что при вставке сообщений сверху коллекция " +
    "пересчитывала контент и сама сдвигала offset. Пришлось запоминать якорь " +
    "по нижнему видимому сообщению и восстанавливать позицию вручную после " +
    "применения изменений.",
  "Если коротко: одна и та же модель данных, два рендерера. На iOS работает " +
    "нативный UICollectionView из пода, на остальных платформах — @legendapp/list " +
    "с теми же размерами, темой и анимациями. Переключатель наверху экрана " +
    "нужен только для сравнения.",
  "Не забудь, что длинные сообщения должны переноситься по словам и не " +
    "растягивать пузырь на всю ширину экрана, максимум восемьдесят пять " +
    "процентов. Проверял на самых узких и самых широких устройствах.",
] as const;

const EMOJI_TEXTS = [
  "👍",
  "🔥",
  "😂",
  "❤️",
  "👍🏻",
  "🎉🎉",
  "😂😂😂",
  "🙏",
] as const;

const LINK_TEXTS = [
  "Держи доку: https://reactnative.dev/docs/performance",
  "Вот тут подробно расписано https://shopify.github.io/flash-list/",
  "Глянь https://developer.apple.com/design/human-interface-guidelines/",
  "Пример лежит тут www.github.com/facebook/react-native",
] as const;

const PHONE_TEXTS = [
  "Позвони мне на +7 999 123-45-67",
  "Мой рабочий: +7 495 987-65-43, звони после трёх",
  "Телефон поддержки 8 800 555-35-35",
] as const;

const SYSTEM_TEXTS = [
  "Сообщения защищены сквозным шифрованием",
  "Алиса добавила вас в чат",
  "Пропущенный звонок",
  "Вы закрепили сообщение",
  "Алиса изменила фото чата",
  "Звонок · 4 мин",
] as const;

const FORWARD_AUTHORS = [
  { firstName: "Пётр", lastName: "Смирнов" },
  { firstName: "Мария", lastName: "Кузнецова" },
  { firstName: "Игорь", lastName: "Волков" },
  { firstName: "Ольга", lastName: "Соколова" },
] as const;

const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏", "🔥"] as const;

const POLL_QUESTIONS = [
  "Го в кино на выходных?",
  "Во сколько созвон?",
  "Какой вариант дизайна берём?",
  "Обед сегодня где?",
  "Кто идёт на конференцию?",
  "Переносим релиз?",
] as const;

const POLL_OPTIONS = [
  ["Сб вечером", "Вс днём", "Не в этот раз"],
  ["10:00", "14:00", "17:30"],
  ["Первый", "Второй", "Оба норм", "Ни один"],
  ["Столовая", "Кофейня", "Закажем доставку"],
  ["Иду", "Не иду", "Ещё думаю"],
  ["Да, переносим", "Нет, успеем"],
] as const;

const FILE_NAMES = [
  "Техническое-задание.pdf",
  "Макеты-чата.zip",
  "Отчёт-за-квартал.pdf",
  "Запись-созвона.mp3",
  "Презентация.pdf",
  "Логи-приложения.zip",
  "Смета.docx",
  "Демо-ролик.mov",
] as const;

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
  mp3: "audio/mpeg",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mov: "video/quicktime",
};

const VOICE_URL =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

const IMAGE_SIZES = [
  { width: 900, height: 600 },
  { width: 640, height: 960 },
  { width: 800, height: 800 },
  { width: 1200, height: 500 },
] as const;

// ─── Построение вложений ────────────────────────────────────────────────────

const imageAttachment = (random: Random, seed: string) => {
  const size = pick(random, IMAGE_SIZES);

  return {
    id: nextMockId(),
    fileId: nextMockId(),
    fileName: `${seed}.jpg`,
    fileUrl: `https://picsum.photos/seed/${seed}/${size.width}/${size.height}`,
    fileType: "image/jpeg",
    fileSize: int(random, 80_000, 900_000),
    thumbnailUrl: `https://picsum.photos/seed/${seed}/${Math.round(
      size.width / 3,
    )}/${Math.round(size.height / 3)}`,
    width: size.width,
    height: size.height,
    duration: null,
    waveform: null,
  };
};

const videoAttachment = (random: Random, seed: string) => ({
  id: nextMockId(),
  fileId: nextMockId(),
  fileName: `${seed}.mp4`,
  fileUrl:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  fileType: "video/mp4",
  fileSize: int(random, 1_200_000, 9_000_000),
  thumbnailUrl: `https://picsum.photos/seed/${seed}/640/360`,
  width: 1280,
  height: 720,
  duration: int(random, 8, 240),
  waveform: null,
});

const voiceAttachment = (random: Random) => {
  const duration = int(random, 3, 180);
  const samples = int(random, 24, 48);
  const waveform: number[] = [];

  // Плавная огибающая + шум — похоже на реальную речь, а не на ровную стену.
  let level = random() * 0.4 + 0.2;

  for (let i = 0; i < samples; i++) {
    level = Math.min(1, Math.max(0.08, level + (random() - 0.5) * 0.45));
    waveform.push(Math.round(level * 100) / 100);
  }

  return {
    id: nextMockId(),
    fileId: nextMockId(),
    fileName: "voice.m4a",
    fileUrl: VOICE_URL,
    fileType: "audio/m4a",
    fileSize: duration * 4_000,
    thumbnailUrl: null,
    width: null,
    height: null,
    duration,
    waveform,
  };
};

const fileAttachment = (random: Random) => {
  const fileName = pick(random, FILE_NAMES);
  const ext = fileName.split(".").pop() ?? "pdf";

  return {
    id: nextMockId(),
    fileId: nextMockId(),
    fileName,
    fileUrl: `https://example.com/files/${fileName}`,
    fileType: MIME_BY_EXT[ext] ?? "application/octet-stream",
    fileSize: int(random, 24_000, 42_000_000),
    thumbnailUrl: null,
    width: null,
    height: null,
    duration: null,
    waveform: null,
  };
};

const buildPoll = (random: Random, messageId: string, createdAt: string) => {
  const questionIndex = int(random, 0, POLL_QUESTIONS.length - 1);
  const options = POLL_OPTIONS[questionIndex].map((text, position) => ({
    id: `${messageId}-opt-${position}`,
    text,
    position,
    voterCount: int(random, 0, 12),
    voterIds: [] as string[],
  }));
  const totalVotes = options.reduce((sum, o) => sum + o.voterCount, 0);
  const isClosed = chance(random, 0.2);

  return {
    id: messageId,
    messageId,
    question: POLL_QUESTIONS[questionIndex],
    isAnonymous: chance(random, 0.5),
    isMultipleChoice: chance(random, 0.3),
    isClosed,
    closedAt: isClosed ? createdAt : null,
    options,
    totalVotes,
    userVotedOptionIds: chance(random, 0.45)
      ? [options[int(random, 0, options.length - 1)].id]
      : [],
    createdAt,
    updatedAt: createdAt,
  };
};

const buildReactions = (random: Random) => {
  const count = int(random, 1, 3);
  const used = new Set<string>();
  const reactions: MessageDto["reactions"] = [];

  for (let i = 0; i < count; i++) {
    const emoji = pick(random, REACTION_EMOJIS);

    if (used.has(emoji)) continue;
    used.add(emoji);

    const isMine = chance(random, 0.35);
    const others = int(random, 1, 9);

    reactions.push({
      emoji,
      count: others + (isMine ? 1 : 0),
      userIds: isMine ? [MOCK_CURRENT_USER_ID] : [MOCK_PEER.id],
    });
  }

  return reactions;
};

// ─── Генерация переписки ────────────────────────────────────────────────────

type MessageKind =
  | "text"
  | "long"
  | "emoji"
  | "link"
  | "phone"
  | "images"
  | "media"
  | "voice"
  | "file"
  | "poll"
  | "system";

/** Распределение типов сообщений — в основном текст, остальное вкраплениями. */
const KIND_WEIGHTS: [MessageKind, number][] = [
  ["text", 46],
  ["long", 8],
  ["emoji", 5],
  ["link", 4],
  ["phone", 2],
  ["images", 9],
  ["media", 3],
  ["voice", 8],
  ["file", 5],
  ["poll", 3],
  ["system", 3],
];

const KIND_TOTAL_WEIGHT = KIND_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);

const pickKind = (random: Random): MessageKind => {
  let ticket = random() * KIND_TOTAL_WEIGHT;

  for (const [kind, weight] of KIND_WEIGHTS) {
    ticket -= weight;
    if (ticket <= 0) return kind;
  }

  return "text";
};

const buildText = (random: Random, kind: MessageKind): string => {
  switch (kind) {
    case "long":
      return pick(random, LONG_TEXTS);
    case "emoji":
      return pick(random, EMOJI_TEXTS);
    case "link":
      return pick(random, LINK_TEXTS);
    case "phone":
      return pick(random, PHONE_TEXTS);
    default:
      return `${pick(random, OPENERS)}, ${pick(random, BODIES)}${pick(
        random,
        ENDINGS,
      )}`;
  }
};

/**
 * Тысяча сообщений за ~месяц переписки: все типы контента, ответы, пересылки,
 * реакции, правки, разделители дат и группы подряд идущих сообщений.
 */
const createBulkMessages = (count: number): MessageDto[] => {
  const random = createRandom(20_240_801);

  // Шаг назад по времени от «часа назад» — так набегает ~месяц истории
  // и в списке появляются разделители дат.
  const timestamps: number[] = [];
  let cursor = Date.now() - 60 * 60_000;

  for (let i = 0; i < count; i++) {
    timestamps.push(cursor);
    cursor -= int(random, 2, 80) * 60_000;
  }
  timestamps.reverse();

  const messages: MessageDto[] = [];

  let senderId: string = MOCK_PEER.id;
  let streak = 0;

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(timestamps[i]).toISOString();
    const kind = pickKind(random);

    if (kind === "system") {
      messages.push(
        baseMessage({
          senderId: null,
          createdAt,
          type: EMessageType.system,
          content: pick(random, SYSTEM_TEXTS),
        }),
      );
      streak = 0;

      continue;
    }

    // Серии подряд идущих сообщений одного отправителя — для группировки
    // и sticky-аватарок.
    if (streak <= 0) {
      senderId = chance(random, 0.45) ? MOCK_CURRENT_USER_ID : MOCK_PEER.id;
      streak = int(random, 1, 4);
    }
    streak -= 1;

    const isMine = senderId === MOCK_CURRENT_USER_ID;
    const minutesOld = (Date.now() - timestamps[i]) / 60_000;

    let status: MessageDto["status"] = EMessageStatus.read;

    if (isMine && minutesOld < 120) {
      status = chance(random, 0.5)
        ? EMessageStatus.delivered
        : EMessageStatus.sent;
    }

    const id = nextMockId();
    const overrides: Partial<MessageDto> = { id, status };

    switch (kind) {
      case "images": {
        const imagesCount = int(random, 1, 5);

        overrides.type = EMessageType.image;
        overrides.attachments = Array.from({ length: imagesCount }, (_, k) =>
          imageAttachment(random, `chat-${i}-${k}`),
        );
        if (chance(random, 0.35)) {
          overrides.content = buildText(random, "text");
        }
        break;
      }
      case "media": {
        // Смешанная сетка: пара фото плюс видео.
        overrides.type = EMessageType.image;
        overrides.attachments = [
          ...Array.from({ length: int(random, 1, 2) }, (_, k) =>
            imageAttachment(random, `chat-${i}-${k}`),
          ),
          videoAttachment(random, `chat-video-${i}`),
        ];
        break;
      }
      case "voice":
        overrides.type = EMessageType.voice;
        overrides.attachments = [voiceAttachment(random)];
        break;
      case "file":
        overrides.type = EMessageType.file;
        overrides.attachments = [fileAttachment(random)];
        if (chance(random, 0.25)) {
          overrides.content = buildText(random, "text");
        }
        break;
      case "poll":
        overrides.type = EMessageType.poll;
        overrides.poll = buildPoll(random, id, createdAt);
        break;
      default:
        overrides.content = buildText(random, kind);
        break;
    }

    // Ответ на одно из недавних сообщений.
    if (messages.length > 0 && chance(random, 0.12)) {
      const target =
        messages[Math.max(0, messages.length - int(random, 1, 12))];

      if (target.type !== EMessageType.system) {
        overrides.replyToId = target.id;
        overrides.replyTo = target;
      }
    }

    // Пересланное — автор берётся из отдельного пула.
    if (kind !== "emoji" && chance(random, 0.05)) {
      const author = pick(random, FORWARD_AUTHORS);

      overrides.forwardedFromId = `forward-${i}`;
      overrides.sender = {
        id: `forward-${i}`,
        firstName: author.firstName,
        lastName: author.lastName,
        avatarUrl: undefined,
      };
    }

    if (kind !== "poll" && chance(random, 0.08)) {
      overrides.isEdited = true;
    }

    if (chance(random, 0.16)) {
      overrides.reactions = buildReactions(random);
    }

    messages.push(baseMessage({ senderId, createdAt, ...overrides }));
  }

  return messages;
};

/** Финальный отрезок переписки — курируемый, показывается при открытии чата. */
const createCuratedMessages = (): MessageDto[] => {
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
          fileUrl: VOICE_URL,
          fileType: "audio/m4a",
          fileSize: 48_000,
          thumbnailUrl: null,
          width: null,
          height: null,
          // Ненормализованная шкала (как отдаёт рекордер) — проверка того,
          // что волна приводится к 0…1 и не упирается в край пузыря.
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

/**
 * Демо-переписка: тысяча сообщений всех типов, свежие — в конце списка.
 * Генерация детерминированная, поэтому нативная и RN-реализации показывают
 * одно и то же и их можно сравнивать переключателем.
 */
export const createMockMessages = (): MessageDto[] => {
  const curated = createCuratedMessages();

  return [
    ...createBulkMessages(MOCK_MESSAGES_TOTAL - curated.length),
    ...curated,
  ];
};
