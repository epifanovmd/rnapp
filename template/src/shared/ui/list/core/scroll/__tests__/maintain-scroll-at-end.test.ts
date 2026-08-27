import { ListStore } from "../../../model";
import { MaintainScrollAtEnd } from "../maintain-scroll-at-end";
import type { IScrollAdapter } from "../scroll-adapter";

const createMaintain = (
  options: { enabled?: boolean; animated?: boolean } = {},
) => {
  const store = new ListStore();
  const adapter: IScrollAdapter = {
    scrollToEnd: jest.fn(),
    scrollToOffset: jest.fn(),
  };
  const maintain = new MaintainScrollAtEnd({
    store,
    adapter: () => adapter,
    enabled: options.enabled ?? true,
    animated: options.animated ?? false,
  });

  store.set("isWithinMaintainScrollAtEndThreshold", true);

  return { store, adapter, maintain };
};

/** Кадр в node не наступает сам. */
const nextFrame = () => jest.advanceTimersByTime(16);

describe("MaintainScrollAtEnd", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("молчит, пока проп не задан", () => {
    const { maintain, adapter } = createMaintain({ enabled: false });

    expect(maintain.run()).toBe(false);

    nextFrame();
    expect(adapter.scrollToEnd).not.toHaveBeenCalled();
  });

  it("молчит, когда пользователь далеко от конца", () => {
    const { store, maintain, adapter } = createMaintain();

    store.set("isWithinMaintainScrollAtEndThreshold", false);

    expect(maintain.run()).toBe(false);

    nextFrame();
    expect(adapter.scrollToEnd).not.toHaveBeenCalled();
  });

  it("скроллит к концу следующим кадром", () => {
    const { maintain, adapter } = createMaintain();

    expect(maintain.run()).toBe(true);
    // К этому моменту новый контент ещё не разложен: конец списка посчитан бы
    // по оценкам.
    expect(adapter.scrollToEnd).not.toHaveBeenCalled();
    expect(maintain.isActive()).toBe(true);

    nextFrame();

    expect(adapter.scrollToEnd).toHaveBeenCalledWith(false);
    expect(maintain.isActive()).toBe(false);
  });

  it("отменяется, если за кадр пользователь увёл список от конца", () => {
    const { store, maintain, adapter } = createMaintain();

    maintain.run();
    store.set("isWithinMaintainScrollAtEndThreshold", false);
    nextFrame();

    // Иначе ленту выдёргивает из-под пальца.
    expect(adapter.scrollToEnd).not.toHaveBeenCalled();
    expect(maintain.isActive()).toBe(false);
  });

  it("копит повторные запросы в один отложенный", () => {
    const { maintain, adapter } = createMaintain();

    maintain.run();
    maintain.run();
    maintain.run();
    nextFrame();

    // Пачка сообщений не должна давать пачку конкурирующих скроллов.
    expect(adapter.scrollToEnd).toHaveBeenCalledTimes(1);
  });

  it("выполняет накопленный запрос после завершения текущего", () => {
    const { maintain, adapter } = createMaintain();

    maintain.run();
    nextFrame();
    expect(adapter.scrollToEnd).toHaveBeenCalledTimes(1);

    maintain.run();
    nextFrame();

    expect(adapter.scrollToEnd).toHaveBeenCalledTimes(2);
  });

  it("ждёт завершения анимированного прилипания", () => {
    const { maintain, adapter } = createMaintain({ animated: true });

    maintain.run();
    nextFrame();

    expect(adapter.scrollToEnd).toHaveBeenCalledWith(true);
    expect(maintain.isActive()).toBe(true);

    jest.advanceTimersByTime(500);
    expect(maintain.isActive()).toBe(false);
  });

  it("сбрасывает накопленный запрос, когда прилипание стало не нужным", () => {
    const { store, maintain, adapter } = createMaintain({ animated: true });

    maintain.run();
    nextFrame();
    maintain.run();

    store.set("isWithinMaintainScrollAtEndThreshold", false);
    jest.advanceTimersByTime(500);
    nextFrame();

    expect(adapter.scrollToEnd).toHaveBeenCalledTimes(1);
  });
});
