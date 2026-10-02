import { sameLines } from "../same-lines";

describe("sameLines", () => {
  it("тот же текст — без новой перерисовки страницы", () => {
    expect(sameLines(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameLines(["a", "b"], ["a", "c"])).toBe(false);
    expect(sameLines(["a"], ["a", "b"])).toBe(false);
    expect(sameLines([], [])).toBe(true);
  });
});
