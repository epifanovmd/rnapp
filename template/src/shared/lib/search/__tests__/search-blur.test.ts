import { shouldCloseOnBlur } from "../search-blur";

describe("shouldCloseOnBlur", () => {
  it("ничего не введено — поиск закрывается", () => {
    expect(shouldCloseOnBlur("", true)).toBe(true);
    expect(shouldCloseOnBlur("   ", true)).toBe(true);
  });

  it("есть запрос — остаётся открытым (результаты на экране)", () => {
    expect(shouldCloseOnBlur("анна", true)).toBe(false);
  });

  it("поведение выключено — не закрывается", () => {
    expect(shouldCloseOnBlur("", false)).toBe(false);
  });
});
