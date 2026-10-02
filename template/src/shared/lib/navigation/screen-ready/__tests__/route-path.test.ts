import {
  findRouteKeyByName,
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

describe("findRouteKeyByName", () => {
  const stack: INavigationStateLike = {
    type: "stack",
    routes: [
      { key: "Chat-1", name: "Chat" },
      {
        key: "Tabs-1",
        name: "Tabs",
        state: { type: "tab", routes: [{ key: "Home-1", name: "Home" }] },
      },
      { key: "Chat-2", name: "Chat" },
    ],
  };

  it("из одноимённых — верхний экран стека", () => {
    expect(findRouteKeyByName(stack, "Chat")).toBe("Chat-2");
  });

  it("находит вложенный экран", () => {
    expect(findRouteKeyByName(stack, "Home")).toBe("Home-1");
  });

  it("экрана нет — null", () => {
    expect(findRouteKeyByName(stack, "Missing")).toBeNull();
    expect(findRouteKeyByName(undefined, "Chat")).toBeNull();
  });
});
