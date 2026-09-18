import {
  isCancelablePromise,
  mapCancelable,
  toCancelable,
} from "../core/cancelable";

describe("cancelable", () => {
  it("toCancelable вешает cancel на тот же промис", async () => {
    const cancel = jest.fn();
    const promise = toCancelable(Promise.resolve(1), cancel);

    promise.cancel("stop");

    expect(cancel).toHaveBeenCalledWith("stop");
    await expect(promise).resolves.toBe(1);
    expect(isCancelablePromise(promise)).toBe(true);
  });

  it("mapCancelable сохраняет отмену исходного промиса", async () => {
    const cancel = jest.fn();
    const source = toCancelable(Promise.resolve(2), cancel);
    const mapped = mapCancelable(source, v => v * 10);

    mapped.cancel("bye");

    expect(cancel).toHaveBeenCalledWith("bye");
    await expect(mapped).resolves.toBe(20);
  });

  it("обычный then теряет cancel — для этого и нужен mapCancelable", () => {
    const source = toCancelable(Promise.resolve(1), () => {});

    expect(isCancelablePromise(source.then(v => v))).toBe(false);
    expect(isCancelablePromise({ cancel() {} })).toBe(false);
  });
});
