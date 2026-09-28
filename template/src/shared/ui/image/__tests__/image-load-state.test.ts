import {
  hasImageSource,
  initialImageLoadStatus,
  shouldRenderImage,
} from "../image-load-state";

describe("hasImageSource", () => {
  it("непустой url и require-ресурс — источник есть", () => {
    expect(hasImageSource("https://a/b.jpg")).toBe(true);
    expect(hasImageSource(42)).toBe(true);
  });

  it("пустой url, null и undefined — источника нет", () => {
    expect(hasImageSource("")).toBe(false);
    expect(hasImageSource(null)).toBe(false);
    expect(hasImageSource(undefined)).toBe(false);
  });
});

describe("initialImageLoadStatus", () => {
  it("с источником стартует загрузка, без — сразу ошибка", () => {
    expect(initialImageLoadStatus("https://a/b.jpg")).toBe("loading");
    expect(initialImageLoadStatus(undefined)).toBe("error");
    expect(initialImageLoadStatus("")).toBe("error");
  });
});

describe("shouldRenderImage", () => {
  it("рендер прекращается только при ошибке", () => {
    expect(shouldRenderImage("loading")).toBe(true);
    expect(shouldRenderImage("loaded")).toBe(true);
    expect(shouldRenderImage("error")).toBe(false);
  });
});
