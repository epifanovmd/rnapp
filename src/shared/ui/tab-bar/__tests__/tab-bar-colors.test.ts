import { resolveTabBarColor, withAlpha } from "../tab-bar-colors";

const colors = { primary: "#3366FF", textSecondary: "#888888" } as never;

describe("resolveTabBarColor", () => {
  it("токен, значение, запасной", () => {
    expect(resolveTabBarColor("primary", colors, "textSecondary")).toBe(
      "#3366FF",
    );
    expect(resolveTabBarColor("#ff0000", colors, "primary")).toBe("#ff0000");
    expect(resolveTabBarColor(undefined, colors, "textSecondary")).toBe(
      "#888888",
    );
  });
});

describe("withAlpha", () => {
  it("добавляет альфу к #RRGGBB", () => {
    expect(withAlpha("#3366FF", 0.15)).toBe("#3366FF26");
    expect(withAlpha("rgba(0,0,0,1)", 0.5)).toBe("rgba(0,0,0,1)");
  });
});
