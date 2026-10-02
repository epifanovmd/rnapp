import { normalizeBase64, toDeviceName } from "../biometric-payload";

describe("normalizeBase64", () => {
  it("убирает переводы строк и пробелы", () => {
    expect(normalizeBase64("MIIB\nIjAN\r\nBgkq ")).toBe("MIIBIjANBgkq");
  });
});

describe("toDeviceName", () => {
  it("обрезает до лимита сервера в 100 символов", () => {
    expect(toDeviceName(` ${"a".repeat(120)} `, "iPhone")).toHaveLength(100);
  });

  it("пустое имя — запасное", () => {
    expect(toDeviceName("  ", "iPhone 17 Pro")).toBe("iPhone 17 Pro");
    expect(toDeviceName(null, "")).toBe("Mobile");
  });
});
