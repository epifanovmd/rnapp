import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

interface HookProbeProps<T> {
  useValue: () => T;
  onValue: (value: T) => void;
}

export const HookProbe = <T>({ useValue, onValue }: HookProbeProps<T>) => {
  onValue(useValue());

  return null;
};

export const renderHook = async <T>(useValue: () => T) => {
  let current!: T;
  let renderer!: TestRenderer.ReactTestRenderer;
  const onValue = (value: T) => {
    current = value;
  };

  await act(async () => {
    renderer = TestRenderer.create(
      createElement(HookProbe<T>, { useValue, onValue }),
    );
  });

  return {
    get current() {
      return current;
    },
    async rerender(nextUseValue: () => T) {
      await act(async () => {
        renderer.update(
          createElement(HookProbe<T>, { useValue: nextUseValue, onValue }),
        );
      });
    },
    async unmount() {
      await act(async () => {
        renderer.unmount();
      });
    },
  };
};
