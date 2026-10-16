import { toAbsoluteUrl } from "../to-absolute-url";

describe("toAbsoluteUrl", () => {
  it("абсолютные адреса и пустое значение не меняет", () => {
    expect(toAbsoluteUrl(undefined)).toBeUndefined();
    expect(toAbsoluteUrl("https://cdn.test/a.png")).toBe(
      "https://cdn.test/a.png",
    );
    expect(toAbsoluteUrl("file:///tmp/a.png")).toBe("file:///tmp/a.png");
  });

  it("склеивает относительный путь с BASE_URL ровно одним слешем", () => {
    expect(toAbsoluteUrl("/uploads/a.png")).toBe(
      "https://api.test/uploads/a.png",
    );
    expect(toAbsoluteUrl("uploads/a.png")).toBe(
      "https://api.test/uploads/a.png",
    );
    expect(toAbsoluteUrl("//uploads/a.png")).toBe(
      "https://api.test/uploads/a.png",
    );
  });
});
