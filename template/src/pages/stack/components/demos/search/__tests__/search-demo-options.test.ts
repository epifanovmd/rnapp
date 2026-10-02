import { isOverlayVisible } from "../search-demo-options";

jest.mock("@shared/ui", () => ({}));

describe("isOverlayVisible", () => {
  it("по режиму, активности и запросу", () => {
    expect(isOverlayVisible("none", true, "")).toBe(false);
    expect(isOverlayVisible("active", true, "анна")).toBe(true);
    expect(isOverlayVisible("empty", true, "")).toBe(true);
    expect(isOverlayVisible("empty", true, "анна")).toBe(false);
    expect(isOverlayVisible("active", false, "")).toBe(false);
  });
});
