import type { SelectOption, SelectOptionGroup } from "@shared/ui";

export interface IDemoUser {
  id: number;
  name: string;
  email: string;
}

export interface IDemoCity {
  id: string;
  name: string;
}

const FIRST_NAMES = [
  "Анна",
  "Борис",
  "Вера",
  "Глеб",
  "Дарья",
  "Егор",
  "Жанна",
  "Илья",
  "Карина",
  "Лев",
];
const LAST_NAMES = [
  "Иванов",
  "Петров",
  "Сидоров",
  "Кузнецов",
  "Смирнов",
  "Попов",
  "Волков",
  "Зайцев",
  "Соколов",
  "Морозов",
];

/** 200 пользователей для серверного поиска и пагинации. */
const USERS: IDemoUser[] = Array.from({ length: 200 }, (_, index) => {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % 10];

  return {
    id: index + 1,
    name: `${first} ${last} #${index + 1}`,
    email: `user${index + 1}@example.com`,
  };
});

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  de: ["Берлин", "Гамбург", "Мюнхен", "Кёльн", "Франкфурт"],
  fr: ["Париж", "Марсель", "Лион", "Тулуза", "Ницца"],
  it: ["Рим", "Милан", "Неаполь", "Турин", "Флоренция"],
};

export const COUNTRY_OPTIONS: SelectOption[] = [
  { value: "de", label: "Германия" },
  { value: "fr", label: "Франция" },
  { value: "it", label: "Италия" },
];

/** Пауза с поддержкой отмены: стратегии отменяют устаревшие запросы. */
const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);

    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    });
  });

const matches = (text: string, query: string) =>
  text.toLowerCase().includes(query.trim().toLowerCase());

/** Серверный поиск пользователей (первые 20 совпадений). */
export const searchUsers = async (
  query: string,
  signal: AbortSignal,
): Promise<IDemoUser[]> => {
  await delay(600, signal);

  return USERS.filter(user => matches(user.name, query)).slice(0, 20);
};

/** Страница пользователей по запросу. */
export const fetchUsersPage = async (
  query: string,
  page: number,
  signal: AbortSignal,
): Promise<IDemoUser[]> => {
  await delay(700, signal);

  return USERS.filter(user => matches(user.name, query)).slice(
    page * 20,
    page * 20 + 20,
  );
};

/** Весь список пользователей одним запросом. */
export const fetchAllUsers = async (
  signal: AbortSignal,
): Promise<IDemoUser[]> => {
  await delay(900, signal);

  return USERS;
};

/** Города страны (зависимый список). */
export const fetchCities = async (
  country: string,
  signal: AbortSignal,
): Promise<IDemoCity[]> => {
  await delay(600, signal);

  return (CITIES_BY_COUNTRY[country] ?? []).map(name => ({
    id: `${country}:${name}`,
    name,
  }));
};

export const userToOption = (user: IDemoUser): SelectOption<number> => ({
  value: user.id,
  label: user.name,
  description: user.email,
});

export const cityToOption = (city: IDemoCity): SelectOption => ({
  value: city.id,
  label: city.name,
});

/** 1000 опций для виртуального списка. */
export const MANY_OPTIONS: SelectOption<number>[] = Array.from(
  { length: 1000 },
  (_, index) => ({
    value: index + 1,
    label: `Вариант ${index + 1}`,
    description: index % 7 === 0 ? `Кратен семи` : undefined,
  }),
);

/** 1000 опций по 10 группам. */
export const MANY_GROUPS: SelectOptionGroup<number>[] = Array.from(
  { length: 10 },
  (_, group) => ({
    group: `Сотня ${group + 1}`,
    options: MANY_OPTIONS.slice(group * 100, group * 100 + 100),
  }),
);

export const FRUIT_GROUPS: SelectOptionGroup[] = [
  {
    group: "Фрукты",
    options: [
      { value: "apple", label: "Яблоко" },
      { value: "pear", label: "Груша" },
      { value: "mango", label: "Манго", disabled: true },
    ],
  },
  {
    group: "Овощи",
    options: [
      { value: "carrot", label: "Морковь" },
      { value: "potato", label: "Картофель" },
    ],
  },
  {
    group: "Ягоды",
    options: [
      { value: "cherry", label: "Вишня" },
      { value: "strawberry", label: "Клубника" },
    ],
  },
];

export const TAG_OPTIONS: SelectOption[] = [
  "react",
  "react-native",
  "typescript",
  "mobx",
  "reanimated",
  "skia",
  "zod",
].map(tag => ({ value: tag, label: tag }));

export const DOMAIN_OPTIONS: SelectOption[] = [
  "gmail.com",
  "yandex.ru",
  "mail.ru",
  "outlook.com",
  "icloud.com",
].map(domain => ({ value: domain, label: domain }));
