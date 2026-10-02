import { formatAppVersion } from "../format-app-version";

describe("formatAppVersion", () => {
  it("версия и номер сборки", () => {
    expect(formatAppVersion("1.2.0", "42")).toBe("1.2.0 (42)");
  });

  it("без номера сборки — только версия", () => {
    expect(formatAppVersion("1.2.0")).toBe("1.2.0");
    expect(formatAppVersion("1.2.0", " ")).toBe("1.2.0");
  });

  it("сборка совпадает с версией — без повтора", () => {
    expect(formatAppVersion("1.2.0", "1.2.0")).toBe("1.2.0");
  });
});
