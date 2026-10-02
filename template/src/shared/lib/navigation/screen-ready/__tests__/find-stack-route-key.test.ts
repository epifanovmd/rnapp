import { findStackRouteKey, INavigationLike } from "../find-stack-route-key";

const nav = (
  state: ReturnType<INavigationLike["getState"]>,
  parent?: INavigationLike,
): INavigationLike => ({ getState: () => state, getParent: () => parent });

const stack = nav({
  type: "stack",
  key: "stack-1",
  routes: [
    { key: "Home-1" },
    { key: "Components-1", state: { key: "tabs-1" } },
  ],
});

describe("findStackRouteKey", () => {
  it("экран прямо в стеке — его собственный ключ", () => {
    expect(findStackRouteKey(stack, "Home-1")).toBe("Home-1");
  });

  it("вкладка внутри экрана стека — ключ этого экрана стека", () => {
    const tabs = nav(
      { type: "tab", key: "tabs-1", routes: [{ key: "Carousel-1" }] },
      stack,
    );

    expect(findStackRouteKey(tabs, "Carousel-1")).toBe("Components-1");
  });

  it("без стека над экраном — null", () => {
    const tabs = nav({ type: "tab", key: "root", routes: [{ key: "A" }] });

    expect(findStackRouteKey(tabs, "A")).toBeNull();
  });
});
