import {
  computeIso6346CheckDigit,
  isValidIso6346,
  parseIso6346,
} from "../iso6346";

describe("computeIso6346CheckDigit", () => {
  it("считает контрольную цифру канонического примера ISO 6346", () => {
    // CSQU305438-3 — пример из самого стандарта
    expect(computeIso6346CheckDigit("CSQU305438")).toBe(3);
  });

  it("считает контрольную цифру MSKU907032 → 3", () => {
    expect(computeIso6346CheckDigit("MSKU907032")).toBe(3);
  });

  it("возвращает -1 для короткого входа", () => {
    expect(computeIso6346CheckDigit("CSQU")).toBe(-1);
  });

  it("возвращает -1 для цифры в буквенной части", () => {
    expect(computeIso6346CheckDigit("1SQU305438")).toBe(-1);
  });

  it("возвращает -1 для буквы в цифровой части", () => {
    expect(computeIso6346CheckDigit("CSQUA05438")).toBe(-1);
  });
});

describe("isValidIso6346", () => {
  it("принимает валидный код", () => {
    expect(isValidIso6346("CSQU3054383")).toBe(true);
    expect(isValidIso6346("MSKU9070323")).toBe(true);
  });

  it("отклоняет неверную контрольную цифру", () => {
    expect(isValidIso6346("CSQU3054380")).toBe(false);
    expect(isValidIso6346("MSKU9070329")).toBe(false);
  });

  it("отклоняет недопустимую категорию оборудования", () => {
    // 4-я буква обязана быть U/J/Z
    expect(isValidIso6346("CSQA3054383")).toBe(false);
  });

  it("отклоняет строку неверной длины", () => {
    expect(isValidIso6346("CSQU305438")).toBe(false);
    expect(isValidIso6346("CSQU30543833")).toBe(false);
  });
});

describe("parseIso6346", () => {
  it("разбирает валидный код на части", () => {
    expect(parseIso6346("CSQU3054383")).toEqual({
      owner: "CSQ",
      category: "U",
      serial: "305438",
      checkDigit: 3,
    });
  });

  it("возвращает null при неверном формате", () => {
    expect(parseIso6346("CSQU305438")).toBeNull();
    expect(parseIso6346("CSQ13054383")).toBeNull();
  });
});
