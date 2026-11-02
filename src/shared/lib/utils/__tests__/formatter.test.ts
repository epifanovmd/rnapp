import { formatter } from "../formatter";

describe("formatter.bytes / formatter.speed", () => {
  it("форматирует объём в пределах таблицы единиц", () => {
    expect(formatter.bytes(0)).toBe("0 B");
    expect(formatter.bytes(1500)).toBe("1.5 KB");
    expect(formatter.bytes(2048, "bits")).toBe("2.0 KiB");
    expect(formatter.speed(2_000_000, "bytes")).toBe("2.0 MB/s");
  });

  it("значения вне таблицы единиц не дают undefined", () => {
    expect(formatter.bytes(0.5)).toBe("0.5 B");
    expect(formatter.bytes(5e15)).toBe("5000.0 TB");
    expect(formatter.speed(0.5, "bytes")).toBe("0.5 B/s");
    expect(formatter.speed(5e12, "bytes")).toBe("5000.0 GB/s");
  });
});
