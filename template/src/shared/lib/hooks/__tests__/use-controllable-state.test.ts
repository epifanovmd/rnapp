import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import {
  type StateUpdater,
  useControllableState,
  type UseControllableStateOptions,
} from "../use-controllable-state";

type Result = [number, (updater: StateUpdater<number>) => void];

interface IProbeProps {
  options: UseControllableStateOptions<number>;
  onResult: (result: Result) => void;
}

const Probe = ({ options, onResult }: IProbeProps) => {
  onResult(useControllableState(options));

  return null;
};

const render = (options: UseControllableStateOptions<number>) => {
  let current!: Result;
  const onResult = (result: Result) => {
    current = result;
  };
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(createElement(Probe, { options, onResult }));
  });

  return {
    get current() {
      return current;
    },
    rerender: (next: UseControllableStateOptions<number>) =>
      act(() => {
        renderer.update(createElement(Probe, { options: next, onResult }));
      }),
  };
};

describe("useControllableState", () => {
  it("неуправляемый: два функциональных апдейтера в одном тике накапливаются", () => {
    const onChange = jest.fn();
    const hook = render({ defaultValue: 0, onChange });

    act(() => {
      hook.current[1](prev => prev + 1);
      hook.current[1](prev => prev + 1);
    });

    expect(hook.current[0]).toBe(2);
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("управляемый: onChange получает накопленное значение в одном тике", () => {
    const onChange = jest.fn();
    const hook = render({ value: 10, defaultValue: 0, onChange });

    act(() => {
      hook.current[1](prev => prev + 1);
      hook.current[1](prev => prev + 1);
    });

    expect(onChange.mock.calls.map(([v]) => v)).toEqual([11, 12]);
    expect(hook.current[0]).toBe(10);
  });

  it("значение-сеттер и следование за управляемым value", () => {
    const hook = render({ value: 5, defaultValue: 0 });

    expect(hook.current[0]).toBe(5);
    hook.rerender({ value: 7, defaultValue: 0 });
    expect(hook.current[0]).toBe(7);

    hook.rerender({ value: undefined, defaultValue: 0 });
    act(() => {
      hook.current[1](3);
    });
    expect(hook.current[0]).toBe(3);
  });
});
