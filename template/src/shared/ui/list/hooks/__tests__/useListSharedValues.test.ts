import { act, createElement } from "react";
import type { SharedValue } from "react-native-reanimated";
import TestRenderer from "react-test-renderer";

import { ListStore } from "../../model";
import type { IListSharedValues } from "../../types";
import { useListSharedValues } from "../useListSharedValues";

/** В node-окружении shared value — обычный носитель значения. */
const sharedValue = <T>(value: T) => ({ value }) as SharedValue<T>;

const render = (
  store: ListStore,
  scrollOffset: SharedValue<number>,
  sharedValues: IListSharedValues | undefined,
) => {
  const Probe = () => {
    useListSharedValues(store, scrollOffset, sharedValues);

    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(createElement(Probe));
  });

  return renderer;
};

/** Флаг, по которому React считает окружение тестовым. */
interface IActEnvironment {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}

/** Рендерер предупреждает о своей устарелости — в выводе это лишний шум. */
const silenceRendererNotice = () => {
  const error = console.error;

  jest.spyOn(console, "error").mockImplementation((...args) => {
    if (String(args[0]).includes("react-test-renderer is deprecated")) return;

    error(...args);
  });
};

describe("useListSharedValues", () => {
  beforeAll(() => {
    (globalThis as IActEnvironment).IS_REACT_ACT_ENVIRONMENT = true;
    silenceRendererNotice();
  });

  it("ничего не делает без объявленных значений", () => {
    const store = new ListStore();

    expect(() => render(store, sharedValue(0), undefined)).not.toThrow();
  });

  it("отдаёт текущее состояние сразу при монтировании", () => {
    const store = new ListStore();
    const activeStickyStartIndex = sharedValue(-1);
    const isNearEnd = sharedValue(false);

    store.set("activeStickyStartIndex", 4);
    store.set("isNearEnd", true);

    render(store, sharedValue(0), { activeStickyStartIndex, isNearEnd });

    expect(activeStickyStartIndex.value).toBe(4);
    expect(isNearEnd.value).toBe(true);
  });

  it("копирует смещение скролла напрямую", () => {
    const store = new ListStore();
    const scrollOffset = sharedValue(320);
    const target = sharedValue(0);

    // Оно уже живёт на UI-потоке — через стор его гонять незачем.
    render(store, scrollOffset, { scrollOffset: target });

    expect(target.value).toBe(320);
  });

  it("обновляет значения при изменении состояния списка", () => {
    const store = new ListStore();
    const activeStickyEndIndex = sharedValue(-1);

    render(store, sharedValue(0), { activeStickyEndIndex });

    act(() => {
      store.set("activeStickyEndIndex", 7);
    });

    expect(activeStickyEndIndex.value).toBe(7);
  });

  it("обновляет только объявленные значения", () => {
    const store = new ListStore();
    const isNearEnd = sharedValue(false);

    render(store, sharedValue(0), { isNearEnd });

    act(() => {
      store.set("activeStickyStartIndex", 3);
      store.set("isNearEnd", true);
    });

    expect(isNearEnd.value).toBe(true);
  });

  it("отписывается при размонтировании", () => {
    const store = new ListStore();
    const isNearEnd = sharedValue(false);
    const renderer = render(store, sharedValue(0), { isNearEnd });

    act(() => {
      renderer.unmount();
    });

    act(() => {
      store.set("isNearEnd", true);
    });

    expect(isNearEnd.value).toBe(false);
  });
});
