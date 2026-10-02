import { isFieldHeightChange } from "../field-layout";

describe("isFieldHeightChange", () => {
  it("первый замер — не рост", () => {
    expect(isFieldHeightChange(-1, 60)).toBe(false);
  });

  it("multiline вырос на строку — пересчёт", () => {
    expect(isFieldHeightChange(24, 44)).toBe(true);
  });

  it("поле сжалось (ушла ошибка) — пересчёт", () => {
    expect(isFieldHeightChange(80, 60)).toBe(true);
  });

  it("субпиксельный дребезг — без пересчёта", () => {
    expect(isFieldHeightChange(60, 60.3)).toBe(false);
  });
});
