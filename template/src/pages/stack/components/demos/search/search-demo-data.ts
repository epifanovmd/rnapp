export interface ISearchDemoContact {
  id: string;
  name: string;
  role: string;
  city: string;
}

const FIRST = ["Анна", "Борис", "Вера", "Глеб", "Дарья", "Егор", "Жанна", "Зоя", "Илья", "Ксения", "Лев", "Мария", "Никита", "Ольга", "Пётр", "Роман", "Софья", "Тимур", "Ульяна", "Фёдор"];
const LAST = ["Смирнов", "Иванов", "Кузнецов", "Попов", "Соколов", "Лебедев", "Козлов", "Новиков"];
const ROLES = ["Дизайнер", "Разработчик", "Аналитик", "Менеджер", "Тестировщик", "DevOps"];
const CITIES = ["Москва", "Казань", "Новосибирск", "Екатеринбург", "Сочи", "Самара", "Пермь"];

/** Фамилия по роду имени: «Смирнов» → «Смирнова». */
const surname = (last: string, first: string) =>
  /[ая]$/.test(first) ? `${last}а` : last;

/** 160 детерминированных контактов для демо поиска. */
export const SEARCH_DEMO_CONTACTS: ISearchDemoContact[] = Array.from(
  { length: 160 },
  (_, index) => {
    const first = FIRST[index % FIRST.length];
    const last = LAST[Math.floor(index / FIRST.length) % LAST.length];

    return {
      id: String(index),
      name: `${first} ${surname(last, first)}`,
      role: ROLES[index % ROLES.length],
      city: CITIES[(index * 3) % CITIES.length],
    };
  },
);

/** Подсказки до ввода запроса. */
export const SEARCH_DEMO_SUGGESTIONS = ["Москва", "Дизайнер", "Фёдор", "DevOps", "Сочи"];
