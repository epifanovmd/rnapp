import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import type { SelectDataProps } from "../../types";
import { useAsyncOptions } from "../use-async-options";

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
  fetchKey: number;
  fetch: (query: string) => Promise<string[]>;
  onValue: (value: SelectDataProps<string>) => void;
}

const Probe = ({ fetchKey, fetch, onValue }: IProbeProps) => {
  onValue(
    useAsyncOptions<string, string>({
      fetch,
      fetchKey,
      loadOnce: true,
      getOption: value => ({ value, label: value }),
    }),
  );

  return null;
};

const flush = async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
    await Promise.resolve();
  });
};

describe("useAsyncOptions", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("смена fetchKey при открытом списке перезагружает опции", async () => {
    let key = 1;
    let current!: SelectDataProps<string>;
    const fetch = jest.fn(async (query: string) => [`${query}-${key}`]);
    const onValue = (value: SelectDataProps<string>) => {
      current = value;
    };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        createElement(Probe, { fetchKey: 1, fetch, onValue }),
      );
    });

    await act(async () => current.onOpenChange?.(true));
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(current.options[0].value).toBe("-1");

    key = 2;
    await act(async () => {
      renderer.update(createElement(Probe, { fetchKey: 2, fetch, onValue }));
    });
    await flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(current.options[0].value).toBe("-2");

    await act(async () => renderer.unmount());
  });
});
