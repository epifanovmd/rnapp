import {
  canToggleKey,
  normalizeHiddenKeys,
  toggleHiddenKey,
} from "../series-visibility";

const keys = ["a", "b", "c"];

describe("toggleHiddenKey", () => {
  it("скрывает видимую серию", () => {
    expect([...toggleHiddenKey(new Set(), keys, "a")]).toEqual(["a"]);
  });

  it("показывает скрытую серию", () => {
    expect([...toggleHiddenKey(new Set(["a"]), keys, "a")]).toEqual([]);
  });

  it("последнюю видимую серию скрыть нельзя", () => {
    const hidden = new Set(["a", "b"]);

    expect(toggleHiddenKey(hidden, keys, "c")).toBe(hidden);
    expect(canToggleKey(hidden, keys, "c")).toBe(false);
  });

  it("неизвестный ключ не меняет набор", () => {
    const hidden = new Set<string>();

    expect(toggleHiddenKey(hidden, keys, "x")).toBe(hidden);
  });
});

describe("normalizeHiddenKeys", () => {
  it("отбрасывает ключи исчезнувших серий", () => {
    expect([...normalizeHiddenKeys(new Set(["a", "x"]), keys)]).toEqual(["a"]);
  });

  it("если скрыто всё — показывает все", () => {
    expect(normalizeHiddenKeys(new Set(["a", "b", "c"]), keys).size).toBe(0);
  });

  it("сохраняет ссылку, если набор не изменился", () => {
    const hidden = new Set(["a"]);

    expect(normalizeHiddenKeys(hidden, keys)).toBe(hidden);
  });
});
