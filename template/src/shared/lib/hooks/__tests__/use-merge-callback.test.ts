import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useMergedCallback } from "../use-merge-callback";

type Callback = (value: number) => void;

interface IProbeProps {
  callbacks: (Callback | undefined)[];
  onResult: (merged: Callback) => void;
}

const Probe = ({ callbacks, onResult }: IProbeProps) => {
  onResult(useMergedCallback(...callbacks));

  return null;
};

const render = (callbacks: (Callback | undefined)[]) => {
  const results: Callback[] = [];
  const onResult = (merged: Callback) => results.push(merged);
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(
      createElement(Probe, { callbacks, onResult }),
    );
  });

  return {
    results,
    rerender: (next: (Callback | undefined)[]) =>
      act(() => {
        renderer.update(createElement(Probe, { callbacks: next, onResult }));
      }),
  };
};

describe("useMergedCallback", () => {
  it("вызывает все колбэки по очереди", () => {
    const calls: string[] = [];
    const { results } = render([
      () => calls.push("a"),
      undefined,
      () => calls.push("b"),
    ]);

    results[0](1);

    expect(calls).toEqual(["a", "b"]);
  });

  it("инлайн-колбэки не меняют identity, но вызывается свежий", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { results, rerender } = render([first]);

    rerender([second]);

    expect(results[1]).toBe(results[0]);

    results[1](2);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(2);
  });

  it("необязательный колбэк появился — identity та же, он вызывается", () => {
    const base = jest.fn();
    const optional = jest.fn();
    const errors = jest.spyOn(console, "error").mockImplementation(() => {});
    const { results, rerender } = render([base, undefined]);

    rerender([base, optional]);
    results[0](3);

    expect(results[1]).toBe(results[0]);
    expect(optional).toHaveBeenCalledWith(3);
    expect(errors.mock.calls.flat().join(" ")).not.toContain("changed size");
    errors.mockRestore();
  });
});
