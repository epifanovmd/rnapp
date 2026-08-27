import { DuplicateKeyGuard } from "../duplicate-key-guard";

describe("DuplicateKeyGuard", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("молчит на уникальных ключах", () => {
    const guard = new DuplicateKeyGuard();

    guard.beginPass();
    guard.check("a", 0);
    guard.check("b", 1);

    expect(warn).not.toHaveBeenCalled();
  });

  it("сообщает о повторе ключа с его индексом", () => {
    const guard = new DuplicateKeyGuard();

    guard.beginPass();
    guard.check("a", 0);
    guard.check("a", 3);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('"a"');
    expect(warn.mock.calls[0]![0]).toContain("индексе 3");
  });

  it("сообщает один раз на ключ, а не на каждое обновление данных", () => {
    const guard = new DuplicateKeyGuard();

    for (let pass = 0; pass < 3; pass++) {
      guard.beginPass();
      guard.check("a", 0);
      guard.check("a", 1);
    }

    // Обновлений данных при скролле десятки в секунду — вывод забился бы повтором.
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("не считает повтором тот же ключ в следующем проходе", () => {
    const guard = new DuplicateKeyGuard();

    guard.beginPass();
    guard.check("a", 0);

    guard.beginPass();
    guard.check("a", 0);

    expect(warn).not.toHaveBeenCalled();
  });

  it("сообщает о каждом повторяющемся ключе отдельно", () => {
    const guard = new DuplicateKeyGuard();

    guard.beginPass();
    guard.check("a", 0);
    guard.check("b", 1);
    guard.check("a", 2);
    guard.check("b", 3);

    expect(warn).toHaveBeenCalledTimes(2);
  });
});
