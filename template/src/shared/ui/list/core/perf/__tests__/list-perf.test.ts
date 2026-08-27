import {
  getPerfRates,
  isListPerfEnabled,
  listPerfCount,
  listPerfSnapshot,
  ListPerfStats,
  resetListPerf,
  setListPerf,
} from "../list-perf";

const createClock = () => {
  let now = 1000;

  return { now: () => now, advance: (ms: number) => (now += ms) };
};

describe("ListPerfStats", () => {
  it("копит счётчики", () => {
    const stats = new ListPerfStats(() => 0);

    stats.count("render");
    stats.count("render", 4);
    stats.count("bind");

    expect(stats.snapshot().counters.render).toBe(5);
    expect(stats.snapshot().counters.bind).toBe(1);
  });

  it("держит худшую пустую область, а не последнюю", () => {
    // Пустая область живёт один кадр: по текущему значению её не поймать.
    const stats = new ListPerfStats(() => 0);

    stats.setBlank(120);
    stats.setBlank(0);

    expect(stats.snapshot()).toMatchObject({ blankNow: 0, blankMax: 120 });
  });

  it("считает худший разрыв между событиями скролла", () => {
    const clock = createClock();
    const stats = new ListPerfStats(clock.now);

    stats.markScroll();
    clock.advance(16);
    stats.markScroll();
    clock.advance(48);
    stats.markScroll();
    clock.advance(16);
    stats.markScroll();

    expect(stats.snapshot().scrollGapMax).toBe(48);
  });

  it("первое событие разрывом не считается", () => {
    const clock = createClock();
    const stats = new ListPerfStats(clock.now);

    clock.advance(5000);
    stats.markScroll();

    expect(stats.snapshot().scrollGapMax).toBe(0);
  });

  it("сброс обнуляет и счётчики, и окно замера", () => {
    const clock = createClock();
    const stats = new ListPerfStats(clock.now);

    stats.count("layout", 10);
    stats.setBlank(50);
    stats.markScroll();
    clock.advance(100);
    stats.markScroll();
    clock.advance(1000);
    stats.reset();

    expect(stats.snapshot()).toMatchObject({
      blankMax: 0,
      scrollGapMax: 0,
      elapsedMs: 0,
    });
    expect(stats.snapshot().counters.layout).toBe(0);
  });

  it("считает число контейнеров как есть", () => {
    const stats = new ListPerfStats(() => 0);

    stats.setContainers(17);

    expect(stats.snapshot().containers).toBe(17);
  });
});

describe("getPerfRates", () => {
  it("переводит счётчики в секунду", () => {
    const clock = createClock();
    const stats = new ListPerfStats(clock.now);

    stats.count("render", 120);
    clock.advance(2000);

    expect(getPerfRates(stats.snapshot()).render).toBe(60);
  });

  it("на нулевом окне отдаёт нули", () => {
    const stats = new ListPerfStats(() => 0);

    stats.count("render", 5);

    expect(getPerfRates(stats.snapshot()).render).toBe(0);
  });
});

describe("замер целиком", () => {
  afterEach(() => setListPerf(false));

  it("выключен по умолчанию и не копит ничего", () => {
    setListPerf(false);
    listPerfCount("render");

    expect(isListPerfEnabled()).toBe(false);
    expect(listPerfSnapshot()).toBeUndefined();
  });

  it("включённый копит и сбрасывается", () => {
    setListPerf(true);
    listPerfCount("render", 3);

    expect(listPerfSnapshot()?.counters.render).toBe(3);

    resetListPerf();

    expect(listPerfSnapshot()?.counters.render).toBe(0);
  });
});
