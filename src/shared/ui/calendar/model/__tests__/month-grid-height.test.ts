import { weeksBlockHeight } from "../month-grid";

describe("weeksBlockHeight", () => {
  it("строки плюс зазоры между ними", () => {
    expect(weeksBlockHeight(5, 56, 2)).toBe(5 * 56 + 4 * 2);
    expect(weeksBlockHeight(6, 56, 0)).toBe(336);
    expect(weeksBlockHeight(1, 40, 8)).toBe(40);
  });
});
