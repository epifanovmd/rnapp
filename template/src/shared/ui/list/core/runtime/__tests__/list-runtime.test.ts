import { ListStore, POSITION_OUT_OF_VIEW } from "../../../model";
import { listPerfSnapshot, setListPerf } from "../../perf";
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

/** Подрезано ли содержимое контейнера под ключом; undefined — ключ не разложен. */
const clippedByKey = (store: ListStore, key: string): boolean | undefined => {
  const count = store.peek("numContainers") ?? 0;

  for (let id = 0; id < count; id++) {
    if (store.peek(`containerItemKey${id}`) === key) {
      return store.peek(`containerClipped${id}`);
    }
  }

  return undefined;
};

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

describe("ListRuntime — координаты шапки", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("считает видимыми только строки, реально попавшие в кадр", () => {
    const { runtime } = createRuntime();

    runtime.setHeaderSize(200);

    // Шапка съела 200 из 500: под ней помещаются три строки, а не пять.
    expect(runtime.getRange()).toMatchObject({ start: 0, end: 2 });
  });

  it("отдаёт смещение скролла в координатах контента", () => {
    const { runtime } = createRuntime();

    runtime.setHeaderSize(60);
    runtime.setScroll(1060);

    // Наружу — то же число, что у нативного скролла; внутрь — координаты
    // элементов, в которых считается раскладка.
    expect(runtime.getScroll()).toBe(1060);
    expect(runtime.getRange()).toMatchObject({ start: 10, end: 14 });
  });

  it("пересчитывает раскладку, когда шапка измерилась", () => {
    const { runtime } = createRuntime();

    runtime.setScroll(1060);
    runtime.setHeaderSize(60);

    // Нативное смещение не менялось — сместилось начало элементов.
    expect(runtime.getScroll()).toBe(1060);
    expect(runtime.getRange()).toMatchObject({ start: 10, end: 14 });
  });

  it("считает расстояние до конца по полной высоте контента", () => {
    const { store, runtime } = createRuntime();

    runtime.setHeaderSize(60);
    runtime.setContentSize(4060);
    runtime.setScroll(3560);

    // Ровно конец контента: ни раньше на высоту шапки, ни позже.
    expect(store.peek("distanceFromEnd")).toBe(0);
    expect(store.peek("isAtEnd")).toBe(true);
  });

  it("удерживает позицию при вставке сверху под шапкой", () => {
    const { store, runtime } = createRuntime(rows(40), {
      maintainVisibleContentPositionData: true,
    });

    runtime.setHeaderSize(60);
    runtime.setContentSize(4060);
    runtime.setScroll(1060);

    runtime.setProps(
      createProps([...rows(5, "h"), ...rows(40)], {
        maintainVisibleContentPositionData: true,
      }),
    );

    expect(store.peek("scrollAdjust")).toBe(500);
    expect(runtime.getScroll()).toBe(1560);
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

    // Пять измеренных по 60 вместо оценки в 100; остальные держат выданную им
    // оценку — задним числом она не меняется.
    expect(store.peek("totalSize")).toBe(3800);
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

  it("отбрасывает замер после перепривязки контейнера", () => {
    const { runtime } = createRuntime(rows(40), {
      getFixedItemSize: undefined,
      recycleItems: true,
    });
    const id = runtime.pool.getContainerByKey("k0")!;

    expect(runtime.isItemSizeFixed("k0")).toBe(false);
    expect(runtime.shouldRecycleItems()).toBe(true);

    const timersBefore = jest.getTimerCount();

    runtime.setContainerItemSize(id, "старый-ключ", 60);
    expect(jest.getTimerCount()).toBe(timersBefore);

    runtime.setContainerItemSize(id, "k0", 60);
    expect(jest.getTimerCount()).toBe(timersBefore + 1);
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

  it("ставит элемент под шапкой, а не под кромкой вьюпорта", () => {
    const { runtime, adapter } = createRuntime();

    runtime.setHeaderSize(60);
    runtime.scrollToIndex({ index: 10 });

    // Элементы лежат под шапкой: без её высоты элемент уезжает ниже кромки.
    expect(adapter.scrollToOffset).toHaveBeenCalledWith(1060, false);
  });

  it("учитывает шапку и при скролле по ключу", () => {
    const { runtime, adapter } = createRuntime();

    runtime.setHeaderSize(60);
    runtime.scrollToKey({ key: "k10" });

    expect(adapter.scrollToOffset).toHaveBeenCalledWith(1060, false);
  });

  it("отдаёт позицию элемента в координатах контента", () => {
    const { runtime } = createRuntime();

    runtime.setHeaderSize(60);

    expect(runtime.getPositionAtIndex(10)).toBe(1060);
    expect(runtime.getPositionByKey("k10")).toBe(1060);
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

describe("ListRuntime — публикация состояния", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("публикует геометрию контента и границу скролла", () => {
    const { store, runtime } = createRuntime();

    expect(store.peek("totalSize")).toBe(4000);
    expect(store.peek("contentSize")).toBe(4000);
    expect(store.peek("maxScroll")).toBe(3500);

    // Замер контента добавил шапку и подвал — граница уехала вместе с ними.
    runtime.setContentSize(4160);

    expect(store.peek("contentSize")).toBe(4160);
    expect(store.peek("maxScroll")).toBe(3660);
  });

  it("не отдаёт отрицательной границы на коротком контенте", () => {
    const { store } = createRuntime(rows(2));

    expect(store.peek("maxScroll")).toBe(0);
  });

  it("публикует границы видимого диапазона", () => {
    const { store, runtime } = createRuntime();

    runtime.setScroll(1000);

    expect(store.peek("firstVisibleIndex")).toBe(10);
    expect(store.peek("lastVisibleIndex")).toBe(14);
  });

  it("сообщает, что видимых элементов нет", () => {
    const { store, runtime } = createRuntime();

    runtime.setProps(createProps([]));

    expect(store.peek("firstVisibleIndex")).toBe(-1);
    expect(store.peek("lastVisibleIndex")).toBe(-1);
  });

  it("публикует скорость скролла", () => {
    const { store, runtime } = createRuntime();

    runtime.setScroll(100);
    jest.advanceTimersByTime(20);
    runtime.setScroll(300);

    expect(store.peek("velocity")).toBeGreaterThan(0);
    expect(store.peek("velocity")).toBe(runtime.getVelocity());
  });

  it("публикует замеры шапки, подвала и вьюпорта", () => {
    const { store, runtime } = createRuntime();

    runtime.setHeaderSize(60);
    runtime.setFooterSize(40);
    runtime.setScrollSize(390, SCROLL_LENGTH);

    expect(store.peek("headerSize")).toBe(60);
    expect(store.peek("footerSize")).toBe(40);
    expect(store.peek("scrollSize")).toEqual({ width: 390, height: 500 });
  });

  it("не будит подписчиков размера вьюпорта без изменений", () => {
    const { store, runtime } = createRuntime();
    const listener = jest.fn();

    runtime.setScrollSize(390, SCROLL_LENGTH);
    store.listen("scrollSize", listener);
    runtime.setScrollSize(390, SCROLL_LENGTH);

    // Новый объект на каждый замер перерисовывал бы всех, кто его читает.
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("ListRuntime — чтение и адресация по ключу", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("отдаёт размер элемента", () => {
    const { runtime } = createRuntime();

    expect(runtime.getSizeAtIndex(3)).toBe(ITEM_SIZE);
    expect(runtime.getSizeAtIndex(-1)).toBeUndefined();
    expect(runtime.getSizeAtIndex(100)).toBeUndefined();
  });

  it("отдаёт полную высоту контента", () => {
    const { runtime } = createRuntime();

    runtime.setContentSize(4160);

    expect(runtime.getContentSize()).toBe(4160);
  });

  it("адресует элемент ключом, а не индексом", () => {
    const { runtime } = createRuntime();

    expect(runtime.getIndexByKey("k10")).toBe(10);
    expect(runtime.getPositionByKey("k10")).toBe(1000);

    // Подгрузка сверху сдвинула индексы, ключ остался прежним.
    runtime.setProps(createProps([...rows(5, "h"), ...rows(40)]));

    expect(runtime.getIndexByKey("k10")).toBe(15);
    expect(runtime.getPositionByKey("k10")).toBe(1500);
  });

  it("скроллит к элементу по ключу", () => {
    const { runtime, adapter } = createRuntime();

    expect(runtime.scrollToKey({ key: "k10" })).toBe(true);
    expect(adapter.scrollToOffset).toHaveBeenCalledWith(1000, false);
  });

  it("сообщает, что ключа в данных нет", () => {
    const { runtime, adapter } = createRuntime();

    expect(runtime.scrollToKey({ key: "missing" })).toBe(false);
    expect(adapter.scrollToOffset).not.toHaveBeenCalled();
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

  it("открывает список над нижней распоркой", () => {
    const store = new ListStore();
    const adapter: IScrollAdapter = {
      scrollToEnd: jest.fn(),
      scrollToOffset: jest.fn(),
      getOffset: jest.fn(() => 0),
    };
    const runtime = new ListRuntime<IRow>(
      store,
      createProps(rows(40), { initialScroll: { type: "end" } }),
    );

    runtime.setAdapter(adapter);
    runtime.setScrollLength(SCROLL_LENGTH);
    // Подвал-распорка под панель ввода приходит замером контента.
    runtime.setContentSize(4080);
    nextFrame();

    // Последняя строка обязана встать над панелью, а не под ней.
    expect(adapter.scrollToOffset).toHaveBeenLastCalledWith(3580, false);
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

describe("ListRuntime — пустая область", () => {
  afterEach(() => setListPerf(false));

  it("не видит пустоты, пока список успевает за скроллом", () => {
    const { runtime } = createRuntime(rows(40), { drawDistance: 250 });

    setListPerf(true);
    runtime.setScroll(120);
    runtime.setScroll(240);

    expect(listPerfSnapshot()?.blankMax).toBe(0);
  });

  it("считает пустоту по прыжку скролла, а не по итогу пересчёта", () => {
    // Замер после привязки всегда даёт ноль: диапазон считается по тому же
    // смещению. Дыра живёт между кадрами — когда скролл ушёл, а разложены ещё
    // прежние строки.
    const { runtime } = createRuntime(rows(40), { drawDistance: 0 });

    setListPerf(true);
    runtime.setScroll(3000);

    // Вьюпорт 3000…3500, разложено было 0…600: пусто целиком.
    expect(listPerfSnapshot()?.blankMax).toBe(SCROLL_LENGTH);
  });

  it("считает частичную дыру у кромки", () => {
    const { runtime } = createRuntime(rows(40), { drawDistance: 0 });

    setListPerf(true);
    runtime.setScroll(300);

    // Разложено 0…600 — диапазон захватывает строку на кромке; вьюпорт
    // 300…800, не закрыто 200.
    expect(listPerfSnapshot()?.blankMax).toBe(200);
  });
});

describe("ListRuntime — проходы раскладки", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    setListPerf(false);
    jest.useRealTimers();
  });

  const countLayouts = (): number => listPerfSnapshot()?.counters.layout ?? 0;

  it("не считает раскладку второй раз, когда сдвига нет", () => {
    // Измерение ниже якоря его не двигает: второй проход повторил бы уже
    // опубликованную раскладку слово в слово.
    const { runtime } = createRuntime(rows(40), {
      getFixedItemSize: undefined,
      maintainVisibleContentPositionSize: true,
    });

    runtime.setScroll(200);
    setListPerf(true);

    runtime.setItemSize("k30", 60);
    nextFrame();

    expect(countLayouts()).toBe(1);
  });

  it("считает раскладку заново, когда сдвиг разошёлся с предсказанным", () => {
    // Первый проход идёт по предсказанному смещению: он уточняет размеры, и
    // итог может от предсказания отличаться — тогда нужен второй.
    const { runtime } = createRuntime(rows(40), {
      getFixedItemSize: undefined,
      maintainVisibleContentPositionSize: true,
    });

    runtime.setScroll(200);
    setListPerf(true);

    // Точность самой компенсации проверяется отдельно, в сценариях mvcp.
    runtime.setItemSize("k30", 60);
    runtime.setItemSize("k31", 60);
    nextFrame();

    expect(countLayouts()).toBeLessThanOrEqual(2);
  });
});

describe("ListRuntime — подрезка у кромки", () => {
  it("не подрезает строку сразу за кадром", () => {
    // На броске она попадает в кадр раньше, чем до неё дойдёт пересчёт:
    // подрезанное содержимое успело бы мелькнуть обрезанным.
    const { store } = createRuntime(rows(40), { drawDistance: 250 });

    // Вьюпорт 0…500, запас подрезки — половина буфера: строка 5 идёт до 600.
    expect(clippedByKey(store, "k5")).toBe(false);
  });

  it("подрезает строку дальше запаса", () => {
    const { store } = createRuntime(rows(40), { drawDistance: 250 });

    // Строка 7 начинается на 700, а подрезка снимается только до 625.
    expect(clippedByKey(store, "k7")).toBe(true);
  });
});
