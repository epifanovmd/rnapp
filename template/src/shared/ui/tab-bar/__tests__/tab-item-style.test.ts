import { tabLabelStyle, tabSizeStyle } from "../tab-item-style";

const keys = (style: object) => Object.keys(style).sort();

describe("tabSizeStyle", () => {
  it("одни и те же ключи в fill и hug — смена режима перекрывает прежний", () => {
    expect(keys(tabSizeStyle(2, "fill", 56))).toEqual(
      keys(tabSizeStyle(2, "hug", 56)),
    );
  });

  it("fill — доля по весу, hug — фиксированная ширина", () => {
    expect(tabSizeStyle(2, "fill", 56)).toEqual({
      flexGrow: 2,
      flexShrink: 1,
      flexBasis: 0,
    });
    expect(tabSizeStyle(2, "hug", 56)).toEqual({
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 112,
    });
  });
});

describe("tabLabelStyle", () => {
  const modes = [
    ["active", "beside"],
    ["active", "below"],
    ["always", "beside"],
    ["always", "below"],
    ["never", "below"],
  ] as const;

  it("одни и те же ключи во всех режимах подписи", () => {
    const reference = keys(tabLabelStyle(0, 0, "active", "beside"));

    for (const [labels, position] of modes) {
      expect(keys(tabLabelStyle(0.5, 0, labels, position))).toEqual(reference);
    }
  });

  it("«только у активной» рядом — раскрывается с выбором", () => {
    expect(tabLabelStyle(1, 0, "active", "beside")).toMatchObject({
      opacity: 0,
      maxWidth: 0,
      marginLeft: 0,
    });
    expect(tabLabelStyle(0, 0, "active", "beside").opacity).toBe(1);
  });

  it("«у всех» — подпись видна целиком, рядом — с отступом", () => {
    expect(tabLabelStyle(3, 0, "always", "beside")).toMatchObject({
      opacity: 1,
      marginLeft: 6,
    });
    expect(tabLabelStyle(3, 0, "always", "below")).toMatchObject({
      opacity: 1,
      marginLeft: 0,
    });
  });

  it("worklet", () => {
    for (const fn of [tabSizeStyle, tabLabelStyle]) {
      expect(fn.toString()).toMatch(/["']worklet["']/);
    }
  });
});
