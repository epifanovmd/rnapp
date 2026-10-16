import { disposer } from "../disposer";

const flush = () => new Promise(resolve => setImmediate(resolve));

describe("disposer", () => {
  it("вызывает функции, массивы и результат промиса", async () => {
    const calls: string[] = [];

    disposer([() => calls.push("a"), () => calls.push("b")]);
    disposer(Promise.resolve(() => calls.push("c")));
    disposer(Promise.resolve([() => calls.push("d")]));
    await flush();

    expect(calls).toEqual(["a", "b", "c", "d"]);
  });

  it("отклонённый промис не даёт необработанного отказа", async () => {
    const unhandled = jest.fn();

    process.on("unhandledRejection", unhandled);
    disposer(Promise.reject(new Error("init failed")));
    await flush();
    await flush();
    process.off("unhandledRejection", unhandled);

    expect(unhandled).not.toHaveBeenCalled();
  });
});
