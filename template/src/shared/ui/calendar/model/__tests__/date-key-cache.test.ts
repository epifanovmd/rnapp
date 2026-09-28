import { addDays, format } from "date-fns";

import { DATE_CACHE_LIMIT, keyToDate } from "../date-key";

// Отдельный файл: кэш — модульный, и порядок вставок должен быть известен с нуля.
describe("date-key: кэш Date", () => {
  it("при переполнении вытесняет только самый старый ключ, а не весь кэш", () => {
    const first = keyToDate("1900-01-01");
    const second = keyToDate("1900-01-02");
    const base = new Date(2000, 0, 1);

    for (let i = 0; i < DATE_CACHE_LIMIT - 1; i++) {
      keyToDate(format(addDays(base, i), "yyyy-MM-dd"));
    }

    expect(keyToDate("1900-01-02")).toBe(second);
    expect(keyToDate("1900-01-01")).not.toBe(first);
  });
});
