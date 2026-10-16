import { createElement } from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";

import { iocContainer } from "../container";
import { createInjectDecorator } from "../create-inject-decorator";

interface IProbe {
  id: number;
}

const IProbe = createInjectDecorator<IProbe>("IProbe:create-inject-decorator");

describe("createInjectDecorator.useInstance", () => {
  beforeEach(() => {
    // react-test-renderer пишет в console.error о своей устарелости.
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    if (!iocContainer.isBound(IProbe.Tid)) {
      iocContainer.bind(IProbe.Tid).toConstantValue({ id: 1 });
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("берёт экземпляр из контейнера один раз, а не на каждом рендере", async () => {
    const get = jest.spyOn(iocContainer, "get");
    const seen: IProbe[] = [];
    const Probe = () => {
      seen.push(IProbe.useInstance());

      return null;
    };
    let renderer: ReactTestRenderer | undefined;

    await act(async () => {
      renderer = create(createElement(Probe));
    });
    await act(async () => renderer?.update(createElement(Probe)));
    await act(async () => renderer?.update(createElement(Probe)));
    await act(async () => renderer?.unmount());

    expect(seen).toHaveLength(3);
    expect(seen.every(instance => instance.id === 1)).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
