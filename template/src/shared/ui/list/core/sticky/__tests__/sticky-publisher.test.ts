import { ListMetrics, ListStore } from "../../../model";
import { setListDebug } from "../../list-debug";
import { StickyAnchors } from "../sticky-anchors";
import { StickyPublisher } from "../sticky-publisher";

const ITEM_SIZE = 100;
const SCROLL_LENGTH = 500;

const createPublisher = () => {
  const store = new ListStore();
  const metrics = new ListMetrics({ estimatedItemSize: ITEM_SIZE });
  const keys = Array.from({ length: 10 }, (_, index) => `k${index}`);

  metrics.setItems(
    keys,
    keys.map(() => ""),
  );

  const anchors = new StickyAnchors({ metrics });

  return { store, anchors, publisher: new StickyPublisher({ store, anchors }) };
};

describe("StickyPublisher", () => {
  afterEach(() => {
    setListDebug([]);
  });

  it("сбрасывает индексы, когда якорей нет", () => {
    const { store, publisher } = createPublisher();

    expect(publisher.resolve(0, SCROLL_LENGTH)).toEqual([]);
    expect(store.peek("activeStickyStartIndex")).toBe(-1);
    expect(store.peek("activeStickyEndIndex")).toBe(-1);
  });

  it("публикует индекс прилипшего элемента начальной кромки", () => {
    const { store, anchors, publisher } = createPublisher();

    anchors.setConfigs([{ edge: "start", indices: [0, 4, 8] }]);
    publisher.resolve(450, SCROLL_LENGTH);

    expect(store.peek("activeStickyStartIndex")).toBe(4);
  });

  it("публикует индекс прилипшего элемента конечной кромки", () => {
    const { store, anchors, publisher } = createPublisher();

    anchors.setConfigs([{ edge: "end", indices: [2, 6] }]);
    publisher.resolve(0, SCROLL_LENGTH);

    expect(store.peek("activeStickyEndIndex")).toBe(6);
  });

  it("возвращает индексы, удерживаемые вне буфера отрисовки", () => {
    const { anchors, publisher } = createPublisher();

    anchors.setConfigs([{ edge: "start", indices: [0, 4, 8] }]);

    expect(publisher.resolve(450, SCROLL_LENGTH).sort()).toEqual([0, 4, 8]);
  });

  it("не трогает кромку, на которой набора нет", () => {
    const { store, anchors, publisher } = createPublisher();

    anchors.setConfigs([{ edge: "start", indices: [0] }]);
    publisher.resolve(0, SCROLL_LENGTH);

    expect(store.peek("activeStickyStartIndex")).toBe(0);
    expect(store.peek("activeStickyEndIndex")).toBe(-1);
  });

  it("сообщает о смене якоря под отладкой", () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    const { anchors, publisher } = createPublisher();

    setListDebug(["sticky"]);
    anchors.setConfigs([{ edge: "start", indices: [0, 4] }]);

    publisher.resolve(0, SCROLL_LENGTH);
    expect(log.mock.calls[0]![0]).toContain("смена якоря");

    log.mockClear();

    // Тот же якорь — сообщать не о чем.
    publisher.resolve(50, SCROLL_LENGTH);
    expect(log).not.toHaveBeenCalled();

    publisher.resolve(450, SCROLL_LENGTH);
    expect(log.mock.calls[0]![0]).toContain("to=4");

    log.mockRestore();
  });
});
