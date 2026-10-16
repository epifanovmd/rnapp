import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import type {
  ICarouselAutoplay,
  ICarouselAutoplayOptions,
} from "../carousel-autoplay.types";
import { useCarouselAutoplay } from "../useCarouselAutoPlay";

jest.mock("react-native-reanimated", () => ({
  useSharedValue: <T>(initial: T) =>
    jest.requireActual<typeof import("react")>("react").useState(() => ({
      value: initial,
    }))[0],
}));

// react-test-renderer предупреждает об устаревании при каждом create — в node-окружении альтернативы ему нет.
const DEPRECATION = "react-test-renderer is deprecated";
const consoleError = console.error;

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes(DEPRECATION)) return;
    consoleError(...args);
  });
});

afterAll(() => jest.restoreAllMocks());

interface IProbeProps {
  options: ICarouselAutoplayOptions;
  onValue: (value: ICarouselAutoplay) => void;
}

const Probe = ({ options, onValue }: IProbeProps) => {
  onValue(useCarouselAutoplay(options));

  return null;
};

const INTERVAL = 1000;

const setup = () => {
  const next = jest.fn();
  const base = {
    enabled: true,
    interval: INTERVAL,
    stopOnInteraction: false,
    resumeAfterEnd: false,
    loop: true,
    count: 5,
    initialIndex: 0,
    progress: { value: 0 },
    touching: { value: false },
    instanceRef: { current: { next } },
  } as unknown as ICarouselAutoplayOptions;
  let current!: ICarouselAutoplay;
  const onValue = (value: ICarouselAutoplay) => {
    current = value;
  };
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(
      createElement(Probe, {
        options: { ...base, onReachEnd: () => undefined },
        onValue,
      }),
    );
  });

  return {
    next,
    get autoplay() {
      return current;
    },
    /** Ре-рендер родителя с новым инлайн-колбэком `onReachEnd`. */
    rerender: () =>
      act(() => {
        renderer.update(
          createElement(Probe, {
            options: { ...base, onReachEnd: () => undefined },
            onValue,
          }),
        );
      }),
    unmount: () => act(() => renderer.unmount()),
  };
};

describe("useCarouselAutoplay", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("ре-рендер с новым onReachEnd не перезапускает отсчёт интервала", () => {
    const harness = setup();

    act(() => jest.advanceTimersByTime(600));
    harness.rerender();
    act(() => jest.advanceTimersByTime(500));

    expect(harness.next).toHaveBeenCalledTimes(1);
    harness.unmount();
  });

  it("ре-рендер с новым onReachEnd не снимает паузу касания", () => {
    const harness = setup();

    act(() => harness.autoplay.handleTouchStart());
    harness.rerender();
    act(() => jest.advanceTimersByTime(INTERVAL * 3));

    expect(harness.next).not.toHaveBeenCalled();
    harness.unmount();
  });
});
