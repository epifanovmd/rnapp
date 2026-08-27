import type { SharedValue } from "react-native-reanimated";

import { POSITION_OUT_OF_VIEW } from "../../model";
import type { IListStickyConfig } from "../../types";
import {
  isContainerParked,
  resolveOverlayRenderer,
  resolveStickyPlacement,
} from "../sticky-placement";

const sharedValue = (value: number) => ({ value }) as SharedValue<number>;

const configs: IListStickyConfig[] = [
  { edge: "start", indices: [0, 4], offset: sharedValue(60) },
  { edge: "end", indices: [6], mode: "offset", size: 36 },
];

describe("resolveStickyPlacement", () => {
  it("считает обычную строку неприлипающей", () => {
    const placement = resolveStickyPlacement(configs, null, 100);

    expect(placement.mode).toBe("container");
    expect(placement.edgeOffset).toBeUndefined();
    expect(placement.stickySize).toBe(100);
  });

  it("берёт отступ кромки из своего набора", () => {
    const placement = resolveStickyPlacement(configs, "start", 100);

    expect(placement.edgeOffset?.value).toBe(60);
    expect(placement.mode).toBe("container");
  });

  it("берёт режим и высоту прилипающего объекта", () => {
    // Аватар группы: строка остаётся на месте, двигается только он.
    const placement = resolveStickyPlacement(configs, "end", 100);

    expect(placement.mode).toBe("offset");
    expect(placement.stickySize).toBe(36);
  });

  it("считает высотой объекта высоту строки по умолчанию", () => {
    const placement = resolveStickyPlacement(
      [{ edge: "start", indices: [0] }],
      "start",
      120,
    );

    expect(placement.stickySize).toBe(120);
  });

  it("обходится без наборов", () => {
    const placement = resolveStickyPlacement([], "start", 100);

    expect(placement.mode).toBe("container");
    expect(placement.stickySize).toBe(100);
  });
});

describe("isContainerParked", () => {
  it("узнаёт контейнер, уведённый за пределы контента", () => {
    // Формула прилипания вернула бы для него позицию ровно на кромке — на
    // экране это вторая копия прилипшего элемента.
    expect(isContainerParked(POSITION_OUT_OF_VIEW)).toBe(true);
  });

  it("не считает уведённой обычную позицию", () => {
    expect(isContainerParked(0)).toBe(false);
    expect(isContainerParked(-100000)).toBe(false);
  });
});

describe("resolveStickyPlacement — прилипшая копия", () => {
  it("у строки целиком копия есть по умолчанию", () => {
    // Копия — это сама строка, рисовать её умеет тот же renderItem.
    expect(resolveStickyPlacement(configs, "start", 44).hasOverlay).toBe(true);
  });

  it("в режиме offset копии нет без своего рендера", () => {
    // У кромки стоит объект внутри строки, и нарисовать его может только
    // вызывающий: без рендера кромка остаётся на старом механизме.
    expect(resolveStickyPlacement(configs, "end", 92).hasOverlay).toBe(false);
  });

  it("в режиме offset копия появляется вместе с рендером", () => {
    const withOverlay: IListStickyConfig[] = [
      { edge: "end", indices: [], mode: "offset", renderOverlay: () => null },
    ];

    expect(resolveStickyPlacement(withOverlay, "end", 92).hasOverlay).toBe(
      true,
    );
  });

  it("у обычной строки копии нет", () => {
    expect(resolveStickyPlacement(configs, null, 92).hasOverlay).toBe(false);
  });
});

describe("resolveOverlayRenderer", () => {
  const renderItem = () => null;

  it("строку целиком рисует тот же renderItem", () => {
    expect(resolveOverlayRenderer(configs[0]!, renderItem)).toBe(renderItem);
  });

  it("режим offset без своего рендера копию не рисует", () => {
    expect(resolveOverlayRenderer(configs[1]!, renderItem)).toBeUndefined();
  });

  it("свой рендер получает элемент и его индекс", () => {
    const renderOverlay = jest.fn(() => null);
    const render = resolveOverlayRenderer(
      { edge: "end", indices: [], mode: "offset", renderOverlay },
      renderItem,
    );

    render?.({ item: "элемент", index: 7, type: "", extraData: undefined });

    expect(renderOverlay).toHaveBeenCalledWith("элемент", 7);
  });
});
