import {
  filterByQuery,
  findMatchRanges,
  matchesQuery,
  normalizeSearchText,
  pushSearchHistory,
  splitByMatches,
} from "../search-text";

describe("normalizeSearchText", () => {
  it("регистр и ё, длина сохраняется", () => {
    expect(normalizeSearchText("Ёлка ЁЖ")).toBe("елка еж");
    expect(normalizeSearchText("Ёлка").length).toBe(4);
  });
});

describe("matchesQuery", () => {
  it("все слова в любом порядке", () => {
    expect(matchesQuery("Анна Смирнова", "смир ан")).toBe(true);
    expect(matchesQuery("Анна Смирнова", "анна петрова")).toBe(false);
    expect(matchesQuery("Фёдор", "федор")).toBe(true);
    expect(matchesQuery("что угодно", "  ")).toBe(true);
  });
});

describe("findMatchRanges / splitByMatches", () => {
  it("все вхождения, пересечения склеены", () => {
    expect(findMatchRanges("ананас", "ана")).toEqual([[0, 3]]);
    expect(findMatchRanges("Анна Ан", "ан")).toEqual([
      [0, 2],
      [5, 7],
    ]);
    expect(findMatchRanges("abcdef", "abc cd")).toEqual([[0, 4]]);
  });

  it("части для подсветки", () => {
    expect(splitByMatches("Анна Смирнова", "смир")).toEqual([
      { text: "Анна ", match: false },
      { text: "Смир", match: true },
      { text: "нова", match: false },
    ]);
    expect(splitByMatches("Текст", "")).toEqual([
      { text: "Текст", match: false },
    ]);
  });
});

describe("filterByQuery", () => {
  const items = [
    { name: "Анна", city: "Москва" },
    { name: "Борис", city: "Казань" },
  ];

  it("по совокупности полей", () => {
    expect(
      filterByQuery(items, "анна моск", item => [item.name, item.city]),
    ).toEqual([items[0]]);
    expect(filterByQuery(items, "", item => [item.name])).toEqual(items);
  });
});

describe("pushSearchHistory", () => {
  it("новый первым, повтор поднимается, лимит", () => {
    expect(pushSearchHistory(["b", "a"], "c", 3)).toEqual(["c", "b", "a"]);
    expect(pushSearchHistory(["b", "A"], "a", 3)).toEqual(["a", "b"]);
    expect(pushSearchHistory(["b", "a"], "c", 2)).toEqual(["c", "b"]);
    expect(pushSearchHistory(["b"], "  ", 3)).toEqual(["b"]);
  });
});
