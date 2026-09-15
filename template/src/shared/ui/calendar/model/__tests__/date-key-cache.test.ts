import dayjs from "dayjs";

import { DAYJS_CACHE_LIMIT, keyToDayjs } from "../date-key";

// Отдельный файл: кэш — модульный, и порядок вставок должен быть известен с нуля.
describe("date-key: кэш dayjs", () => {
  it("при переполнении вытесняет только самый старый ключ, а не весь кэш", () => {
    const first = keyToDayjs("1900-01-01", "en");
    const second = keyToDayjs("1900-01-02", "en");
    const base = dayjs("2000-01-01");

    for (let i = 0; i < DAYJS_CACHE_LIMIT - 1; i++) {
      keyToDayjs(base.add(i, "day").format("YYYY-MM-DD"), "en");
    }

    expect(keyToDayjs("1900-01-02", "en")).toBe(second);
    expect(keyToDayjs("1900-01-01", "en")).not.toBe(first);
  });
});
