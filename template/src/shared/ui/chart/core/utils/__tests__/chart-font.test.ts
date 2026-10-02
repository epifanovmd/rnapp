import { resolveChartFontFamily } from "../chart-font";

jest.mock("@shopify/react-native-skia", () => ({ matchFont: jest.fn() }));

describe("resolveChartFontFamily", () => {
  it("«System» и пусто — системное семейство платформы", () => {
    expect(resolveChartFontFamily(undefined, "android")).toBe("sans-serif");
    expect(resolveChartFontFamily("System", "android")).toBe("sans-serif");
    expect(resolveChartFontFamily(undefined, "ios")).toBe("System");
    expect(resolveChartFontFamily("System", "ios")).toBe("System");
  });

  it("своё семейство — как есть", () => {
    expect(resolveChartFontFamily("Menlo", "android")).toBe("Menlo");
    expect(resolveChartFontFamily("Roboto Mono", "ios")).toBe("Roboto Mono");
  });
});
