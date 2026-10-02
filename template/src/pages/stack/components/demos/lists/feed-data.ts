/** Пост ленты для демо: автор, время, текст разной длины, метки, счётчики. */
export interface IFeedPost {
  id: string;
  author: string;
  minutesAgo: number;
  text: string;
  tags: string[];
  likes: number;
  comments: number;
}

export const FEED_SIZE = 10_000;

const AUTHORS = [
  "Анна Смирнова",
  "Илья Кузнецов",
  "Мария Орлова",
  "Денис Волков",
  "Ольга Павлова",
  "Сергей Лебедев",
  "Екатерина Соколова",
  "Павел Морозов",
];

const SENTENCES = [
  "Закрыли спринт без переносов.",
  "Обновили дизайн карточек в мобильном приложении — стало заметно чище.",
  "Кто посмотрит ревью по модулю оплаты до конца дня?",
  "Релиз 2.4 уехал в стор, следим за метриками первые сутки.",
  "Нашли причину падения на старых устройствах: дело было в кэше изображений.",
  "Провели созвон с заказчиком, требования к отчётам уточнили.",
  "Документацию по API перенесли в общий раздел, ссылки обновлены.",
  "Новые участники проекта — добро пожаловать!",
];

const TAGS = ["релиз", "дизайн", "бэкенд", "ревью", "аналитика", "команда"];

/** Детерминированный псевдослучайный генератор: лента одинакова между запусками. */
const seeded = (seed: number) => {
  const value = Math.sin(seed * 9301 + 49297) * 233280;

  return value - Math.floor(value);
};

const pick = <T>(items: readonly T[], seed: number) =>
  items[Math.floor(seeded(seed) * items.length)];

/** Лента из `count` постов: длина текста 1–5 предложений, 0–3 метки. */
export const createFeed = (count: number = FEED_SIZE): IFeedPost[] =>
  Array.from({ length: count }, (_, index) => {
    const sentences = 1 + Math.floor(seeded(index + 1) * 5);
    const tagCount = Math.floor(seeded(index + 2) * 4);

    return {
      id: `post-${index}`,
      author: pick(AUTHORS, index + 3),
      minutesAgo: index * 7 + Math.floor(seeded(index + 4) * 7),
      text: Array.from({ length: sentences }, (__, part) =>
        pick(SENTENCES, index * 11 + part),
      ).join(" "),
      tags: Array.from({ length: tagCount }, (__, part) =>
        pick(TAGS, index * 13 + part),
      ).filter((tag, position, all) => all.indexOf(tag) === position),
      likes: Math.floor(seeded(index + 5) * 300),
      comments: Math.floor(seeded(index + 6) * 40),
    };
  });

/** «5 мин», «3 ч», «2 дн» — возраст поста. */
export const formatPostAge = (minutes: number) => {
  if (minutes < 60) return `${minutes} мин`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} ч`;

  return `${Math.floor(minutes / (60 * 24))} дн`;
};

let feedCache: IFeedPost[] | null = null;

/** Лента по умолчанию — строится один раз, переключение режимов её не пересоздаёт. */
export const getFeed = (): IFeedPost[] => {
  feedCache ??= createFeed();

  return feedCache;
};
