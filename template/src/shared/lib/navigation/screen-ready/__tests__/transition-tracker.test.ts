import {
  createTransitionTracker,
  screenTransitionListeners,
  screenTransitions,
} from "../transition-tracker";

describe("createTransitionTracker", () => {
  it("помнит открытые экраны и оповещает подписчиков", () => {
    const tracker = createTransitionTracker();
    const listener = jest.fn();

    tracker.subscribe(listener);
    tracker.markOpened("a");
    tracker.markOpened("a");

    expect(tracker.isOpened("a")).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    tracker.forget("a");

    expect(tracker.isOpened("a")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("отписка прекращает оповещения", () => {
    const tracker = createTransitionTracker();
    const listener = jest.fn();
    const unsubscribe = tracker.subscribe(listener);

    unsubscribe();
    tracker.markOpened("a");

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("screenTransitionListeners", () => {
  it("открытие — по transitionEnd, закрытие — забывает экран", () => {
    const listeners = screenTransitionListeners({ route: { key: "screen" } });

    listeners.transitionEnd({ data: { closing: true } });
    expect(screenTransitions.isOpened("screen")).toBe(false);

    listeners.transitionEnd({ data: { closing: false } });
    expect(screenTransitions.isOpened("screen")).toBe(true);

    listeners.transitionStart({ data: { closing: true } });
    expect(screenTransitions.isOpened("screen")).toBe(false);
  });
});
