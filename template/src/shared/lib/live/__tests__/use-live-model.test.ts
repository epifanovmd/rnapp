import { iocContainer } from "@shared/lib/di";
import { ISocketTransport } from "@shared/lib/socket";
import { createFakeSocket } from "@shared/lib/socket/testing";
import { createElement } from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";

import { ILiveLoadResult, ILiveModel, useLiveModel } from "../use-live-model";

jest.mock("@react-native-community/netinfo", () => ({}));
jest.mock("socket.io-client", () => ({ connect: jest.fn() }));

interface ISnapshot {
  id: string;
}

/** Загрузчик, ответы которого тест отдаёт вручную и в любом порядке. */
const createDeferredLoad = () => {
  const pending = new Map<
    string,
    (result: ILiveLoadResult<ISnapshot>) => void
  >();

  return {
    load: (id: string) =>
      new Promise<ILiveLoadResult<ISnapshot>>(resolve => {
        pending.set(id, resolve);
      }),
    resolve: (id: string) => pending.get(id)?.({ data: { id } }),
  };
};

describe("useLiveModel", () => {
  beforeEach(() => {
    // react-test-renderer пишет в console.error о своей устарелости.
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    if (iocContainer.isBound(ISocketTransport.Tid)) {
      iocContainer.unbind(ISocketTransport.Tid);
    }
    iocContainer.bind(ISocketTransport.Tid).toConstantValue(createFakeSocket());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("запоздавший ответ прежнего id не перетирает данные текущего", async () => {
    const { load, resolve } = createDeferredLoad();
    let model: ILiveModel<ISnapshot> | undefined;
    const Probe = ({ id }: { id: string }) => {
      model = useLiveModel<ISnapshot>({ id, event: "stats", load });

      return null;
    };
    let renderer: ReactTestRenderer | undefined;

    await act(async () => {
      renderer = create(createElement(Probe, { id: "a" }));
    });
    await act(async () => renderer?.update(createElement(Probe, { id: "b" })));

    await act(async () => resolve("b"));
    await act(async () => resolve("a"));

    expect(model?.live).toEqual({ id: "b" });
    await act(async () => renderer?.unmount());
  });
});
