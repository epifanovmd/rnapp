import { bottomRadiusStyle, resolveBarBackground } from "../bar-appearance";

jest.mock("react", () => ({ createContext: () => ({}) }));

const colors = { background: "#000000", surface: "#111111" } as never;

describe("resolveBarBackground", () => {
  it("без фона — фон экрана", () => {
    expect(resolveBarBackground(undefined, colors)).toBe("#000000");
  });

  it("токен темы → цвет", () => {
    expect(resolveBarBackground("surface", colors)).toBe("#111111");
  });

  it("цвет — как есть", () => {
    expect(resolveBarBackground("#ff0000", colors)).toBe("#ff0000");
    expect(resolveBarBackground("transparent", colors)).toBe("transparent");
  });
});

describe("bottomRadiusStyle", () => {
  it("скругляет только нижние углы", () => {
    expect(bottomRadiusStyle(20)).toEqual({
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    });
    expect(bottomRadiusStyle()).toBeUndefined();
    expect(bottomRadiusStyle(0)).toBeUndefined();
  });
});
