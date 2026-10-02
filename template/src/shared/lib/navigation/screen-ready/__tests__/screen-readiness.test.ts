import { INavigationStateLike } from "../route-path";
import { createScreenReadiness } from "../screen-readiness";
import { createTransitionTracker } from "../transition-tracker";

const createSource = (initial: INavigationStateLike) => {
  let state = initial;
  const listeners = new Set<() => void>();
  const tracker = createTransitionTracker();

  return {
    tracker,
    getRootState: () => state,
    subscribeState: (listener: () => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setState: (next: INavigationStateLike) => {
      state = next;
      listeners.forEach(listener => listener());
    },
  };
};

const stackWith = (index: number): INavigationStateLike => ({
  type: "stack",
  index,
  routes: [
    { key: "Home", name: "Home" },
    { key: "Demo", name: "Demo" },
  ],
});

describe("createScreenReadiness", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("готов после фокуса и конца анимации открытия", () => {
    const source = createSource(stackWith(1));
    const readiness = createScreenReadiness(source);
    const callback = jest.fn();

    readiness.onReady("Demo", callback);
    expect(callback).not.toHaveBeenCalled();

    source.tracker.markOpened("Demo");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("ждёт фокуса", () => {
    const source = createSource(stackWith(0));
    const readiness = createScreenReadiness(source);
    const callback = jest.fn();

    source.tracker.markOpened("Demo");
    readiness.onReady("Demo", callback);
    expect(callback).not.toHaveBeenCalled();

    source.setState(stackWith(1));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("без события анимации отпускает по таймауту", () => {
    const source = createSource(stackWith(1));
    const readiness = createScreenReadiness(source);
    const callback = jest.fn();

    readiness.onReady("Demo", callback, { timeout: 500 });
    jest.advanceTimersByTime(499);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("задержка после выполнения условий", () => {
    const source = createSource(stackWith(1));
    const readiness = createScreenReadiness(source);
    const callback = jest.fn();

    source.tracker.markOpened("Demo");
    readiness.onReady("Demo", callback, { delay: 200 });
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("отмена — колбэк не вызывается", () => {
    const source = createSource(stackWith(1));
    const readiness = createScreenReadiness(source);
    const callback = jest.fn();

    const cancel = readiness.onReady("Demo", callback);

    cancel();
    source.tracker.markOpened("Demo");
    jest.runAllTimers();

    expect(callback).not.toHaveBeenCalled();
  });

  it("экран вне дерева готов сразу; whenReady — промисом", async () => {
    const source = createSource(stackWith(1));
    const readiness = createScreenReadiness(source);

    expect(readiness.isReady("Missing")).toBe(true);
    await expect(readiness.whenReady("Missing")).resolves.toBeUndefined();
  });

  it("по имени: ждёт появления экрана и отдаёт его ключ", () => {
    const source = createSource({
      type: "stack",
      index: 0,
      routes: [{ key: "Home", name: "Home" }],
    });
    const readiness = createScreenReadiness(source);
    const callback = jest.fn();

    readiness.onRouteReady("Demo", callback);
    expect(callback).not.toHaveBeenCalled();

    source.setState(stackWith(1));
    source.tracker.markOpened("Demo");

    expect(callback).toHaveBeenCalledWith("Demo");
  });

  it("whenRouteReady резолвится ключом экрана", async () => {
    const source = createSource(stackWith(1));
    const readiness = createScreenReadiness(source);

    source.tracker.markOpened("Demo");

    await expect(readiness.whenRouteReady("Demo")).resolves.toBe("Demo");
  });
});
