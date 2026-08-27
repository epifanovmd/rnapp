import { ListStore, POSITION_OUT_OF_VIEW } from "../../../model";
import type { IScrollAdapter } from "../../scroll";
import { ListRuntime } from "../list-runtime";
import type { IListRuntimeProps } from "../runtime-props";

const ITEM_SIZE = 100;
const SCROLL_LENGTH = 500;

interface IRow {
  id: string;
  size: number;
}

const rows = (count: number, prefix = "k", size = ITEM_SIZE): IRow[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}${index}`,
    size,
  }));

const createProps = (
  data: IRow[],
  overrides: Partial<IListRuntimeProps<IRow>> = {},
): IListRuntimeProps<IRow> => ({
  data,
  keyExtractor: item => item.id,
  getFixedItemSize: item => item.size,
  estimatedItemSize: ITEM_SIZE,
  drawDistance: 0,
  startReachedThreshold: 0.5,
  endReachedThreshold: 0.5,
  maintainScrollAtEndThreshold: 0.1,
  maintainScrollAtEnd: false,
  maintainScrollAtEndAnimated: false,
  maintainVisibleContentPositionData: false,
  maintainVisibleContentPositionSize: false,
  alignItemsAtEnd: false,
  ...overrides,
});

const createRuntime = (
  data = rows(40),
  overrides: Partial<IListRuntimeProps<IRow>> = {},
) => {
  const store = new ListStore();
  const adapter: IScrollAdapter = {
    scrollToEnd: jest.fn(),
    scrollToOffset: jest.fn(),
    getOffset: jest.fn(() => 0),
  };
  const runtime = new ListRuntime<IRow>(store, createProps(data, overrides));

  runtime.setAdapter(adapter);
  runtime.setScrollLength(SCROLL_LENGTH);

  return { store, runtime, adapter };
};

const nextFrame = () => jest.advanceTimersByTime(16);

/** Ключи, разложенные по контейнерам в текущий момент. */
const boundKeys = (store: ListStore): string[] => {
  const count = store.peek("numContainers") ?? 0;
  const keys: string[] = [];

  for (let id = 0; id < count; id++) {
    const key = store.peek(`containerItemKey${id}`);
    const position = store.peek(`containerPosition${id}`);

    if (key !== undefined && position !== POSITION_OUT_OF_VIEW) keys.push(key);
  }

  return keys.sort();
};

describe("ListRuntime — раскладка", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("считает диапазон после измерения вьюпорта", () => {
    const { store, runtime } = createRuntime();

    expect(runtime.getScrollLength()).toBe(SCROLL_LENGTH);
    expect(runtime.getRange()).toMatchObject({ start: 0, end: 4 });
    expect(store.peek("totalSize")).toBe(4000);
    expect(store.peek("scrollLength")).toBe(SCROLL_LENGTH);
  });

  it("монтирует только элементы диапазона", () => {
    const { store } = createRuntime();

    expect(boundKeys(store)).toEqual(["k0", "k1", "k2", "k3", "k4", "k5"]);
  });

  it("сдвигает диапазон вместе со скроллом", () => {
    const { store, runtime } = createRuntime();

    runtime.setScroll(1000);

    expect(runtime.getScroll()).toBe(1000);
    expect(runtime.getRange()).toMatchObject({ start: 10, end: 14 });
    expect(boundKeys(store)).toContain("k12");
    expect(boundKeys(store)).not.toContain("k0");
  });

  it("расширяет диапазон буфером отрисовки", () => {
    const { runtime } = createRuntime(rows(40), { drawDistance: 250 });

    runtime.setScroll(1000);

    expect(runtime.getRange()).toMatchObject({
      startBuffered: 7,
      endBuffered: 17,
    });
  });

  it("не пересчитывает раскладку на повторном смещении", () => {
    const { store, runtime } = createRuntime();

    runtime.setScroll(1000);

    const listener = jest.fn();

    store.listen("containerPosition0", listener);
    runtime.setScroll(1000);

    expect(listener).not.toHaveBeenCalled();
  });

  it("освобождает контейнеры на опустевшем списке", () => {
    const { store, runtime } = createRuntime();

    runtime.setProps(createProps([]));

    expect(store.peek("totalSize")).toBe(0);
    expect(boundKeys(store)).toEqual([]);
    expect(runtime.getRange().end).toBeLessThan(runtime.getRange().start);
  });

  it("не меняет размер вьюпорта на то же значение", () => {
    const { store, runtime } = createRuntime();
    const listener = jest.fn();

    store.listen("scrollLength", listener);
    runtime.setScrollLength(SCROLL_LENGTH);

    expect(listener).not.toHaveBeenCalled();
  });

  it("отдаёт позицию элемента и элемент по индексу", () => {
    const { runtime } = createRuntime();

    expect(runtime.getPositionAtIndex(3)).toBe(300);
    expect(runtime.getPositionAtIndex(-1)).toBeUndefined();
    expect(runtime.getPositionAtIndex(100)).toBeUndefined();
    expect(runtime.getItemAt(3)).toMatchObject({ id: "k3" });
  });
});

describe("ListRuntime — измерения", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("копит измерения до конца кадра", () => {
    const { store, runtime } = createRuntime(rows(40), {
      getFixedItemSize: undefined,
    });

    for (let index = 0; index < 5; index++) {
      runtime.setItemSize(`k${index}`, 60);
    }

    // Пересчёт на каждое измерение стоил бы стольких же полных проходов.
    expect(store.peek("totalSize")).toBe(4000);

    nextFrame();

    // Измеренные пять по 60, остальные — по набранному среднему того же типа.
    expect(store.peek("totalSize")).toBe(2400);
  });

  it("не принимает измерение, ничего не меняющее в раскладке", () => {
    const { runtime } = createRuntime(rows(40), {
      getFixedItemSize: undefined,
    });

    runtime.setItemSize("k0", 60);
    nextFrame();

    const scheduled = jest.getTimerCount();

    // Доли пикселя — шум округления экрана.
    runtime.setItemSize("k0", 60.3);

    expect(jest.getTimerCount()).toBe(scheduled);
  });

  it("не перебивает объявленный размер измерением", () => {
    const { store, runtime } = createRuntime();

    runtime.setItemSize("k0", 333);
    nextFrame();

    expect(store.peek("totalSize")).toBe(4000);
  });
});

describe("ListRuntime — удержание позиции", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("компенсирует вставку выше вьюпорта", () => {
    const { store, runtime } = createRuntime(rows(40), {
      maintainVisibleContentPositionData: true,
    });

    runtime.setScroll(1000);
    runtime.setProps(
      createProps([...rows(5, "h"), ...rows(40)], {
        maintainVisibleContentPositionData: true,
      }),
    );

    expect(runtime.getScroll()).toBe(1500);
    expect(store.peek("scrollAdjust")).toBe(500);
    // Диапазон пересчитан по новому смещению, а не по старому.
    expect(runtime.getRange()).toMatchObject({ start: 15, end: 19 });
  });

  it("не компенсирует, когда удержание выключено", () => {
    const { store, runtime } = createRuntime();

    runtime.setScroll(1000);
    runtime.setProps(createProps([...rows(5, "h"), ...rows(40)]));

    expect(runtime.getScroll()).toBe(1000);
    expect(store.peek("scrollAdjust")).toBe(0);
  });

  it("компенсирует изменение размера строки выше вьюпорта", () => {
    const { store, runtime } = createRuntime(rows(40), {
      getFixedItemSize: undefined,
      maintainVisibleContentPositionSize: true,
    });

    for (let index = 0; index < 40; index++)
      runtime.setItemSize(`k${index}`, 100);
    nextFrame();

    runtime.setScroll(1000);
    runtime.setItemSize("k2", 300);
    nextFrame();

    expect(store.peek("scrollAdjust")).toBe(200);
    expect(runtime.getScroll()).toBe(1200);
  });

  it("отбрасывает событие скролла, отправленное до применения сдвига", () => {
    const { runtime } = createRuntime(rows(40), {
      maintainVisibleContentPositionData: true,
    });

    runtime.setScroll(1000);
    runtime.setProps(
      createProps([...rows(5, "h"), ...rows(40)], {
        maintainVisibleContentPositionData: true,
      }),
    );

    runtime.setScroll(1004);

    // Принять его — значит откатить только что сделанный сдвиг.
    expect(runtime.getScroll()).toBe(1500);
  });
});

describe("ListRuntime — кромки и скролл", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("вызывает подгрузку у конца списка", () => {
    const onEndReached = jest.fn();
    const { runtime } = createRuntime(rows(40), { onEndReached });

    runtime.setScroll(3300);

    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it("не вызывает подгрузку во время программного скролла", () => {
    const onEndReached = jest.fn();
    const { runtime } = createRuntime(rows(40), { onEndReached });

    runtime.scrollToOffset(3300, true);
    runtime.setScroll(3300);

    // Иначе программный переезд к концу немедленно запускает подгрузку.
    expect(onEndReached).not.toHaveBeenCalled();
  });

  it("двигает нативный скролл через адаптер", () => {
    const { runtime, adapter } = createRuntime();

    runtime.scrollToOffset(300);
    runtime.scrollToEnd();
    runtime.scrollToIndex({ index: 10 });

    expect(adapter.scrollToOffset).toHaveBeenCalledWith(300, false);
    expect(adapter.scrollToEnd).toHaveBeenCalledWith(false);
    expect(adapter.scrollToOffset).toHaveBeenCalledWith(1000, false);
  });

  it("ставит элемент в заданное место вьюпорта", () => {
    const { runtime, adapter } = createRuntime();

    runtime.scrollToIndex({ index: 10, viewPosition: 1 });

    // Низ элемента у нижней кромки: 1000 + 100 - 500.
    expect(adapter.scrollToOffset).toHaveBeenCalledWith(600, false);
  });

  it("молчит на скролле к несуществующему индексу", () => {
    const { runtime, adapter } = createRuntime();

    runtime.scrollToIndex({ index: 500 });

    expect(adapter.scrollToOffset).not.toHaveBeenCalled();
  });

  it("разблокирует кромку по направлению жеста", () => {
    const onStartReached = jest.fn();
    const { runtime } = createRuntime(rows(40), { onStartReached });

    // Первый вход в зону начала закрывает общий гейт.
    runtime.setScroll(2000);
    jest.advanceTimersByTime(20);
    runtime.setScroll(100);
    expect(onStartReached).toHaveBeenCalledTimes(1);

    runtime.onGestureEnd();
    jest.advanceTimersByTime(20);
    runtime.setScroll(90);
    // Жест идёт к началу списка — начальная кромка разблокируется.
    runtime.onGestureBegin();
    runtime.setScroll(50);

    expect(onStartReached).toHaveBeenCalledTimes(2);
  });

  it("копит скорость по событиям скролла", () => {
    const { runtime } = createRuntime();

    runtime.setScroll(100);
    jest.advanceTimersByTime(20);
    runtime.setScroll(300);

    expect(runtime.getVelocity()).toBeGreaterThan(0);
  });
});

describe("ListRuntime — прочее", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("показывает список, когда видимая часть измерена", () => {
    const { store } = createRuntime();

    expect(store.peek("readyToRender")).toBe(true);
  });

  it("не показывает список с неизмеренными строками", () => {
    const { store } = createRuntime(rows(40), { getFixedItemSize: undefined });

    expect(store.peek("readyToRender")).toBe(false);
  });

  it("показывает список по страховке, если измерений не пришло", () => {
    const { store } = createRuntime(rows(40), { getFixedItemSize: undefined });

    jest.advanceTimersByTime(150);

    expect(store.peek("readyToRender")).toBe(true);
  });

  it("публикует прилипший якорь", () => {
    const { store, runtime } = createRuntime(rows(40), {
      sticky: [{ edge: "start", indices: [0, 10, 20] }],
    });

    runtime.setScroll(1200);

    expect(store.peek("activeStickyStartIndex")).toBe(10);
    // Якорь держится смонтированным, даже уйдя за буфер.
    expect(boundKeys(store)).toContain("k10");
  });

  it("учитывает вклад шапки в высоту контента", () => {
    const { runtime } = createRuntime();

    runtime.setContentSize(4060);
    runtime.setScroll(3560);

    // Без учёта шапки список считал бы, что скролл ушёл за конец контента.
    expect(runtime.getRange().end).toBe(39);
  });

  it("уведомляет о видимых элементах", () => {
    const onViewableItemsChanged = jest.fn();
    const { runtime } = createRuntime(rows(40), {
      viewabilityPairs: [
        { config: { itemVisiblePercentThreshold: 50 }, onViewableItemsChanged },
      ],
    });

    runtime.setScroll(1000);

    expect(onViewableItemsChanged).toHaveBeenCalled();
  });

  it("снимает таймеры и ожидания при размонтировании", () => {
    const { runtime } = createRuntime(rows(40), {
      getFixedItemSize: undefined,
    });

    runtime.scrollToOffset(300, true);
    runtime.dispose();

    expect(jest.getTimerCount()).toBe(0);
  });
});
