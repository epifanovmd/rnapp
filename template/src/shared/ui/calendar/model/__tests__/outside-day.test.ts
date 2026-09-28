import { monthToNavigateOnPress } from "../outside-day";

describe("monthToNavigateOnPress", () => {
  it("хвост соседнего месяца → его месяц", () => {
    expect(monthToNavigateOnPress("2026-08-31", "2026-09", true)).toBe(
      "2026-08",
    );
    expect(monthToNavigateOnPress("2026-10-04", "2026-09", true)).toBe(
      "2026-10",
    );
  });

  it("день текущего месяца или выключенная навигация → null", () => {
    expect(monthToNavigateOnPress("2026-09-15", "2026-09", true)).toBeNull();
    expect(monthToNavigateOnPress("2026-08-31", "2026-09", false)).toBeNull();
  });
});
