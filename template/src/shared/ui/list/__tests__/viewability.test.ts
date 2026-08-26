import type { IViewabilityContext } from "../core";
import { ViewabilityTracker } from "../core";
import { ListMetrics } from "../model";

const ITEM_SIZE = 100;
const ITEM_COUNT = 10;
const SCROLL_LENGTH = 500;

interface IRow {
  id: string;
}

const createTracker = () => {
  const metrics = new ListMetrics({ estimatedItemSize: ITEM_SIZE });
  const data: IRow[] = Array.from({ length: ITEM_COUNT }, (_, index) => ({
    id: `k${index}`,
  }));

  metrics.setItems(
    data.map(row => row.id),
    data.map(() => ""),
  );

  const tracker = new ViewabilityTracker<IRow>({
    metrics,
    getItem: index => data[index],
  });

  return { tracker, metrics };
};

const context = (scroll: number): IViewabilityContext => ({
  scroll,
  scrollLength: SCROLL_LENGTH,
  startBuffered: 0,
  endBuffered: ITEM_COUNT - 1,
});

describe("ViewabilityTracker", () => {
  it("сообщает о попавших во вьюпорт элементах", () => {
    const { tracker } = createTracker();
    const onViewableItemsChanged = jest.fn();

    tracker.setPairs([
      { config: { itemVisiblePercentThreshold: 50 }, onViewableItemsChanged },
    ]);
    tracker.update(context(0));

    const info = onViewableItemsChanged.mock.calls[0]![0];

    // Вьюпорт 0..500 полностью накрывает пять элементов по 100.
    expect(
      info.viewableItems.map((token: { key: string }) => token.key),
    ).toEqual(["k0", "k1", "k2", "k3", "k4"]);
  });

  it("не уведомляет повторно, пока видимость не изменилась", () => {
    const { tracker } = createTracker();
    const onViewableItemsChanged = jest.fn();

    tracker.setPairs([
      { config: { itemVisiblePercentThreshold: 50 }, onViewableItemsChanged },
    ]);
    tracker.update(context(0));
    tracker.update(context(0));

    expect(onViewableItemsChanged).toHaveBeenCalledTimes(1);
  });

  it("сообщает о вышедших из вьюпорта элементах", () => {
    const { tracker } = createTracker();
    const onViewableItemsChanged = jest.fn();

    tracker.setPairs([
      { config: { itemVisiblePercentThreshold: 50 }, onViewableItemsChanged },
    ]);
    tracker.update(context(0));
    onViewableItemsChanged.mockClear();

    tracker.update(context(300));

    const info = onViewableItemsChanged.mock.calls[0]![0];
    const gone = info.changed.filter(
      (token: { isViewable: boolean }) => !token.isViewable,
    );

    expect(gone.map((token: { key: string }) => token.key)).toEqual([
      "k0",
      "k1",
      "k2",
    ]);
  });

  it("учитывает порог по доле элемента", () => {
    const { tracker } = createTracker();
    const onViewableItemsChanged = jest.fn();

    tracker.setPairs([
      { config: { itemVisiblePercentThreshold: 80 }, onViewableItemsChanged },
    ]);

    // Скролл 50: у k0 видно лишь половину — порога в 80% не хватает.
    tracker.update(context(50));

    const info = onViewableItemsChanged.mock.calls[0]![0];

    expect(
      info.viewableItems.map((token: { key: string }) => token.key),
    ).not.toContain("k0");
  });

  it("учитывает порог по доле вьюпорта", () => {
    const { tracker } = createTracker();
    const onViewableItemsChanged = jest.fn();

    // Элемент занимает 100 из 500 — ровно 20% вьюпорта.
    tracker.setPairs([
      {
        config: { viewAreaCoveragePercentThreshold: 25 },
        onViewableItemsChanged,
      },
    ]);
    tracker.update(context(0));

    expect(onViewableItemsChanged).not.toHaveBeenCalled();
  });

  it("выдерживает minimumViewTime перед уведомлением", () => {
    jest.useFakeTimers();

    const { tracker } = createTracker();
    const onViewableItemsChanged = jest.fn();

    tracker.setPairs([
      {
        config: { itemVisiblePercentThreshold: 50, minimumViewTime: 200 },
        onViewableItemsChanged,
      },
    ]);
    tracker.update(context(0));

    expect(onViewableItemsChanged).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);

    expect(onViewableItemsChanged).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("не уведомляет об элементе, мелькнувшем меньше выдержки", () => {
    jest.useFakeTimers();

    const { tracker } = createTracker();
    const onViewableItemsChanged = jest.fn();

    tracker.setPairs([
      {
        config: { itemVisiblePercentThreshold: 50, minimumViewTime: 200 },
        onViewableItemsChanged,
      },
    ]);

    tracker.update(context(0));
    // Быстрый скролл увёл элементы до истечения выдержки.
    tracker.update(context(900));
    jest.advanceTimersByTime(200);

    const notifiedKeys = onViewableItemsChanged.mock.calls.flatMap(
      ([info]: [{ changed: { key: string }[] }]) =>
        info.changed.map(token => token.key),
    );

    expect(notifiedKeys).not.toContain("k0");

    jest.useRealTimers();
  });

  it("снимает таймеры удалённой пары", () => {
    jest.useFakeTimers();

    const { tracker } = createTracker();
    const onViewableItemsChanged = jest.fn();
    const pair = {
      config: { itemVisiblePercentThreshold: 50, minimumViewTime: 200 },
      onViewableItemsChanged,
    };

    tracker.setPairs([pair]);
    tracker.update(context(0));
    tracker.setPairs([]);
    jest.advanceTimersByTime(200);

    expect(onViewableItemsChanged).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
