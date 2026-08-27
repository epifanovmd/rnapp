import type { SharedValue } from "react-native-reanimated";

import { POSITION_OUT_OF_VIEW } from "../../model";
import type { IListStickyConfig } from "../../types";
import { isContainerParked, resolveStickyPlacement } from "../sticky-placement";

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
