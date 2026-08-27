import {
  isListDebugEnabled,
  listDebug,
  listDebugWorklet,
  setListDebug,
} from "../list-debug";

describe("отладочное логирование списка", () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    setListDebug([]);
    log.mockRestore();
  });

  it("по умолчанию молчит", () => {
    listDebug("scroll", "сообщение");

    // Логи пишутся на каждом кадре скролла и сами влияют на плавность.
    expect(log).not.toHaveBeenCalled();
    expect(isListDebugEnabled("scroll")).toBe(false);
  });

  it("включается по темам точечно", () => {
    setListDebug(["mvcp"]);

    expect(isListDebugEnabled("mvcp")).toBe(true);
    expect(isListDebugEnabled("scroll")).toBe(false);

    listDebug("scroll", "не должно попасть в вывод");
    expect(log).not.toHaveBeenCalled();

    listDebug("mvcp", "сдвиг");
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("округляет числа: сотые доли пикселя в логах только мешают", () => {
    setListDebug(["mvcp"]);

    listDebug("mvcp", "сдвиг", { applied: 12.3456, key: "k1" });

    expect(log.mock.calls[0]![0]).toBe(
      "[list:mvcp] сдвиг applied=12.35 key=k1",
    );
  });

  it("печатает сообщение без данных", () => {
    setListDebug(["range"]);

    listDebug("range", "диапазон");

    expect(log.mock.calls[0]![0]).toBe("[list:range] диапазон ");
  });

  it("лог с UI-потока управляется переданным флагом", () => {
    listDebugWorklet(false, "молчит", { offset: 1 });
    expect(log).not.toHaveBeenCalled();

    // Флаг передаётся значением: worklet захватывает замыкание при создании и
    // позднейшего изменения модульной переменной не увидит.
    listDebugWorklet(true, "смещение", { offset: 1.005 });
    expect(log.mock.calls[0]![0]).toBe("[list:ui] смещение offset=1");
  });
});
