import { createDisposer, disposer } from "../disposer";

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe("disposer", () => {
  it("вызывает функцию и массив функций", () => {
    const a = jest.fn();
    const b = jest.fn();

    disposer([a, b]);
    disposer(a);

    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("дожидается промиса и вызывает то, что он вернул", async () => {
    const a = jest.fn();
    const b = jest.fn();

    disposer(Promise.resolve(a));
    disposer(Promise.resolve([b]));
    await flush();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("отклонённый промис не даёт unhandled rejection", async () => {
    const onUnhandled = jest.fn();

    process.on("unhandledRejection", onUnhandled);
    disposer(Promise.reject(new Error("initialize failed")));
    await flush();
    await flush();
    process.off("unhandledRejection", onUnhandled);

    expect(onUnhandled).not.toHaveBeenCalled();
  });
});

describe("Disposer", () => {
  it("копит функции и вызывает их один раз", () => {
    const a = jest.fn();
    const instance = createDisposer().add(a, [jest.fn()]);

    expect(instance.size).toBe(2);
    instance.dispose();
    instance.dispose();

    expect(a).toHaveBeenCalledTimes(1);
    expect(instance.size).toBe(0);
  });
});
