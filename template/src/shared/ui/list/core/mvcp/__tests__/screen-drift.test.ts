import { ListMetrics } from "../../../model";
import { setListDebug } from "../../list-debug";
import { ScreenDrift } from "../screen-drift";

const ITEM_SIZE = 100;

const createDrift = () => {
  const metrics = new ListMetrics({ estimatedItemSize: ITEM_SIZE });
  const keys = Array.from({ length: 20 }, (_, index) => `k${index}`);

  metrics.setItems(
    keys,
    keys.map(() => ""),
  );
  for (const key of keys) metrics.setMeasuredSize(key, ITEM_SIZE);

  return { metrics, drift: new ScreenDrift(metrics) };
};

describe("ScreenDrift", () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    setListDebug([]);
    log.mockRestore();
  });

  it("ничего не собирает без отладки", () => {
    const { metrics, drift } = createDrift();

    drift.snapshot(10, 1500);
    metrics.setMeasuredSize("k10", 400);
    drift.report("тест", 0);

    // Проход по видимым строкам на каждое изменение раскладки в рабочем пути
    // не нужен.
    expect(log).not.toHaveBeenCalled();
  });

  it("молчит, когда соседи уехали ровно на сдвиг", () => {
    setListDebug(["mvcp"]);

    const { metrics, drift } = createDrift();

    drift.snapshot(10, 1500);
    // Вставка выше вьюпорта двигает всех одинаково — это и есть удержание.
    metrics.setItems(
      ["new", ...Array.from({ length: 20 }, (_, index) => `k${index}`)],
      new Array(21).fill(""),
    );
    metrics.setMeasuredSize("new", 300);

    drift.report("тест", 300);

    expect(log).not.toHaveBeenCalled();
  });

  it("сообщает о строке, уехавшей не на ту величину", () => {
    setListDebug(["mvcp"]);

    const { metrics, drift } = createDrift();

    drift.snapshot(10, 1500);
    // Строка внутри экрана подросла: всё под ней уехало сильнее якоря — это и
    // есть видимое мерцание.
    metrics.setMeasuredSize("k11", 180);
    drift.report("тест", 0);

    expect(log).toHaveBeenCalled();
    expect(log.mock.calls[0]![0]).toContain("строка уехала на экране");
    expect(log.mock.calls[0]![0]).toContain("key=k12");
  });

  it("не считает заметным смещение меньше половины пикселя", () => {
    setListDebug(["mvcp"]);

    const { metrics, drift } = createDrift();

    drift.snapshot(10, 1500);
    metrics.setMeasuredSize("k11", 100.3);
    drift.report("тест", 0);

    expect(log).not.toHaveBeenCalled();
  });

  it("пропускает строки, исчезнувшие из данных", () => {
    setListDebug(["mvcp"]);

    const { metrics, drift } = createDrift();

    drift.snapshot(10, 1500);
    metrics.setItems(
      Array.from({ length: 10 }, (_, index) => `k${index}`),
      new Array(10).fill(""),
    );

    expect(() => drift.report("тест", 0)).not.toThrow();
    expect(log).not.toHaveBeenCalled();
  });

  it("не повторяет отчёт по тому же снимку", () => {
    setListDebug(["mvcp"]);

    const { metrics, drift } = createDrift();

    drift.snapshot(10, 1500);
    metrics.setMeasuredSize("k11", 180);

    drift.report("тест", 0);
    log.mockClear();

    drift.report("тест", 0);
    expect(log).not.toHaveBeenCalled();
  });

  it("отбрасывает снимок по требованию", () => {
    setListDebug(["mvcp"]);

    const { metrics, drift } = createDrift();

    drift.snapshot(10, 1500);
    drift.clear();
    metrics.setMeasuredSize("k11", 180);
    drift.report("тест", 0);

    expect(log).not.toHaveBeenCalled();
  });

  it("не выходит за нижнюю кромку вьюпорта", () => {
    setListDebug(["mvcp"]);

    const { metrics, drift } = createDrift();

    // Снимок ограничен экраном 1000..1500; строка ниже в него не входит.
    drift.snapshot(10, 1500);
    metrics.setMeasuredSize("k19", 500);
    drift.report("тест", 0);

    expect(log).not.toHaveBeenCalled();
  });
});
