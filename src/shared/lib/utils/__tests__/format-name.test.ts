import { formatFullName, formatInitials } from "../format-name";

describe("formatFullName / formatInitials", () => {
  it("собирает имя и инициалы из заданных частей", () => {
    expect(formatFullName("Иван", null)).toBe("Иван");
    expect(formatFullName(null, null)).toBe("Unknown");
    expect(formatInitials("иван", "петров")).toBe("ИП");
    expect(formatInitials(null, undefined)).toBe("U");
  });

  it("пустой fallback не роняет форматирование инициалов", () => {
    expect(formatInitials(null, null, "")).toBe("");
  });
});
