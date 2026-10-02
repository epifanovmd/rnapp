import {
  findRoutePath,
  INavigationStateLike,
  isPathFocused,
  resolveStackRouteKey,
} from "../route-path";

const ROOT: INavigationStateLike = {
  type: "stack",
  index: 1,
  routes: [
    {
      key: "Tabs-1",
      state: {
        type: "tab",
        index: 0,
        routes: [{ key: "Home-1" }, { key: "Settings-1" }],
      },
    },
    {
      key: "Demo-1",
      state: {
        type: "tab",
        index: 1,
        routes: [{ key: "First-1" }, { key: "Second-1" }],
      },
    },
  ],
};

describe("findRoutePath", () => {
  it("путь от корня до вложенного экрана", () => {
    expect(findRoutePath(ROOT, "Second-1")).toEqual([
      { navigatorType: "stack", routeKey: "Demo-1", focused: true },
      { navigatorType: "tab", routeKey: "Second-1", focused: true },
    ]);
  });

  it("экрана нет в дереве — null", () => {
    expect(findRoutePath(ROOT, "Missing")).toBeNull();
    expect(findRoutePath(undefined, "Home-1")).toBeNull();
  });
});

describe("resolveStackRouteKey", () => {
  it("вкладка внутри экрана стека — ключ экрана стека", () => {
    const path = findRoutePath(ROOT, "Second-1")!;

    expect(resolveStackRouteKey(path)).toBe("Demo-1");
  });

  it("экран прямо в стеке — его ключ", () => {
    expect(resolveStackRouteKey(findRoutePath(ROOT, "Demo-1")!)).toBe(
      "Demo-1",
    );
  });

  it("без стека на пути — null", () => {
    const tabsOnly: INavigationStateLike = {
      type: "tab",
      routes: [{ key: "A" }],
    };

    expect(resolveStackRouteKey(findRoutePath(tabsOnly, "A")!)).toBeNull();
  });
});

describe("isPathFocused", () => {
  it("активен, только если активен на каждом уровне", () => {
    expect(isPathFocused(findRoutePath(ROOT, "Second-1")!)).toBe(true);
    expect(isPathFocused(findRoutePath(ROOT, "First-1")!)).toBe(false);
    expect(isPathFocused(findRoutePath(ROOT, "Home-1")!)).toBe(false);
  });

  it("стек без индекса — активен верхний экран", () => {
    const stack: INavigationStateLike = {
      type: "stack",
      routes: [{ key: "A" }, { key: "B" }],
    };

    expect(isPathFocused(findRoutePath(stack, "B")!)).toBe(true);
    expect(isPathFocused(findRoutePath(stack, "A")!)).toBe(false);
  });
});
