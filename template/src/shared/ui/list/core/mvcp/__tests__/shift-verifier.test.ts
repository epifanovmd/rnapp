import { setListDebug } from "../../list-debug";
import type { IScrollAdapter } from "../../scroll";
import { verifyShift } from "../shift-verifier";

const createAdapter = (offsets: number[]): IScrollAdapter => {
  let call = 0;

  return {
    scrollToEnd: jest.fn(),
    scrollToOffset: jest.fn(),
    getOffset: () => offsets[Math.min(call++, offsets.length - 1)]!,
  };
};

/** Кадры в node не идут сами. */
const flushFrames = (count: number) => {
  for (let index = 0; index < count; index++) jest.advanceTimersByTime(16);
};

describe("verifyShift", () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
    log = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    setListDebug([]);
    log.mockRestore();
    jest.useRealTimers();
  });

  it("ничего не делает без отладки", () => {
    const adapter = createAdapter([1000, 1300]);
    const getOffset = jest.spyOn(adapter, "getOffset");

    verifyShift(() => adapter, 300);
    flushFrames(5);

    // Чтение shared value из JS ходит на UI-поток и блокирует вызывающего.
    expect(getOffset).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("сверяет фактическое смещение через пару кадров", () => {
    setListDebug(["mvcp"]);

    const adapter = createAdapter([1000, 1300]);

    verifyShift(() => adapter, 300);

    expect(log).not.toHaveBeenCalled();

    flushFrames(2);

    expect(log.mock.calls[0]![0]).toContain("проверка");
    expect(log.mock.calls[0]![0]).toContain("error=0");
  });

  it("показывает пиксели, на которые контент уехал на глазах", () => {
    setListDebug(["mvcp"]);

    const adapter = createAdapter([1000, 1280]);

    verifyShift(() => adapter, 300);
    flushFrames(2);

    expect(log.mock.calls[0]![0]).toContain("realized=280");
    expect(log.mock.calls[0]![0]).toContain("error=-20");
  });

  it("молчит без адаптера", () => {
    setListDebug(["mvcp"]);

    verifyShift(() => undefined, 300);
    flushFrames(3);

    expect(log).not.toHaveBeenCalled();
  });

  it("молчит, когда адаптер не отдаёт смещение", () => {
    setListDebug(["mvcp"]);

    verifyShift(
      () => ({ scrollToEnd: jest.fn(), scrollToOffset: jest.fn() }),
      300,
    );
    flushFrames(3);

    expect(log).not.toHaveBeenCalled();
  });

  it("молчит, если адаптер исчез за время ожидания", () => {
    setListDebug(["mvcp"]);

    let adapter: IScrollAdapter | undefined = createAdapter([1000]);

    verifyShift(() => adapter, 300);
    adapter = undefined;
    flushFrames(3);

    expect(log).not.toHaveBeenCalled();
  });
});
