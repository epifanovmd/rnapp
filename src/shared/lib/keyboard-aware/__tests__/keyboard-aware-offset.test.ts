import {
  clampScrollOffset,
  computeKeyboardAwareOffset,
  computeMaxScrollOffset,
  IKeyboardAwareOffsetInput,
  interpolateScrollOffset,
  keyboardOverlap,
  keyboardProgress,
  predictShiftedViewport,
  shouldScrollTo,
} from "../keyboard-aware-offset";

/** Экран 800, клавиатура 300 → её верх на 500, зазор 16 → видимый низ 484. */
const base: IKeyboardAwareOffsetInput = {
  fieldTop: 0,
  fieldBottom: 0,
  visibleTop: 100,
  screenHeight: 800,
  keyboardHeight: 300,
  bottomOffset: 16,
  currentOffset: 200,
  maxOffset: 1000,
};

describe("computeKeyboardAwareOffset", () => {
  it("поле над клавиатурой и ниже верха — смещение не меняется", () => {
    expect(
      computeKeyboardAwareOffset({ ...base, fieldTop: 300, fieldBottom: 380 }),
    ).toBe(200);
  });

  it("поле под клавиатурой поднимается целиком с зазором", () => {
    expect(
      computeKeyboardAwareOffset({ ...base, fieldTop: 600, fieldBottom: 680 }),
    ).toBe(200 + (680 - 484));
  });

  it("поле, ушедшее выше видимого верха, возвращается вниз", () => {
    expect(
      computeKeyboardAwareOffset({ ...base, fieldTop: 40, fieldBottom: 120 }),
    ).toBe(200 - 60);
  });

  it("высокое поле не поднимается выше видимого верха", () => {
    expect(
      computeKeyboardAwareOffset({ ...base, fieldTop: 300, fieldBottom: 900 }),
    ).toBe(200 + 200);
  });

  it("высокое поле, начало которого выше верха, прижимается началом", () => {
    expect(
      computeKeyboardAwareOffset({ ...base, fieldTop: 50, fieldBottom: 900 }),
    ).toBe(200 - 50);
  });

  it("цель ограничена максимальным смещением", () => {
    expect(
      computeKeyboardAwareOffset({
        ...base,
        fieldTop: 600,
        fieldBottom: 680,
        maxOffset: 300,
      }),
    ).toBe(300);
  });

  it("цель не уходит ниже нуля", () => {
    expect(
      computeKeyboardAwareOffset({
        ...base,
        fieldTop: -400,
        fieldBottom: -320,
        currentOffset: 100,
      }),
    ).toBe(0);
  });

  it("скролл кончается выше клавиатуры — низ берётся от скролла (шторка)", () => {
    expect(
      computeKeyboardAwareOffset({
        ...base,
        viewportBottom: 400,
        fieldTop: 380,
        fieldBottom: 440,
      }),
    ).toBe(200 + (440 - 384));
  });

  it("без клавиатуры поле держится над низом скролла", () => {
    expect(
      computeKeyboardAwareOffset({
        ...base,
        keyboardHeight: 0,
        fieldTop: 700,
        fieldBottom: 790,
      }),
    ).toBe(200 + (790 - 784));
  });

  it("поле целиком видно — смещение не трогается, даже за прогнозным пределом", () => {
    expect(
      computeKeyboardAwareOffset({
        ...base,
        fieldTop: 300,
        fieldBottom: 380,
        currentOffset: 1200,
      }),
    ).toBe(1200);
  });

  it("верхнее поле в шторке: прогнозная область вмещает его — смещение то же", () => {
    const viewport = predictShiftedViewport({
      restTop: 120,
      restHeight: 600,
      shift: { lift: 0, shrink: 314 },
    });

    expect(
      computeKeyboardAwareOffset({
        ...base,
        fieldTop: 140,
        fieldBottom: 200,
        visibleTop: viewport.top,
        viewportBottom: viewport.top + viewport.height,
        currentOffset: 40,
        maxOffset: 10,
      }),
    ).toBe(40);
  });
});

describe("keyboardProgress", () => {
  it("открытие: доля пройденного пути", () => {
    expect(keyboardProgress(150, 0, 300)).toBe(0.5);
  });

  it("закрытие: доля от полной к нулю", () => {
    expect(keyboardProgress(75, 300, 0)).toBe(0.75);
  });

  it("без изменения высоты — сразу 1", () => {
    expect(keyboardProgress(300, 300, 300)).toBe(1);
  });

  it("выход за пределы зажимается", () => {
    expect(keyboardProgress(-10, 0, 300)).toBe(0);
    expect(keyboardProgress(320, 0, 300)).toBe(1);
  });
});

describe("interpolateScrollOffset", () => {
  it("линейно от начального к целевому", () => {
    expect(interpolateScrollOffset(100, 300, 0)).toBe(100);
    expect(interpolateScrollOffset(100, 300, 0.25)).toBe(150);
    expect(interpolateScrollOffset(100, 300, 1)).toBe(300);
  });
});

describe("keyboardOverlap", () => {
  it("скролл до низа экрана — перекрытие равно клавиатуре", () => {
    expect(keyboardOverlap(800, 800, 300)).toBe(300);
  });

  it("скролл кончается выше — перекрытие меньше", () => {
    expect(keyboardOverlap(700, 800, 300)).toBe(200);
  });

  it("скролл целиком над клавиатурой — без перекрытия", () => {
    expect(keyboardOverlap(400, 800, 300)).toBe(0);
  });

  it("клавиатура скрыта — без перекрытия", () => {
    expect(keyboardOverlap(800, 800, 0)).toBe(0);
  });
});

describe("computeMaxScrollOffset", () => {
  it("конец контента — верх распорки плюс её высота", () => {
    expect(computeMaxScrollOffset(1500, 300, 700)).toBe(1100);
  });

  it("контент короче вьюпорта — ноль", () => {
    expect(computeMaxScrollOffset(300, 0, 700)).toBe(0);
  });
});

describe("clampScrollOffset", () => {
  it("зажимает в [0, max], отрицательный max — ноль", () => {
    expect(clampScrollOffset(-5, 100)).toBe(0);
    expect(clampScrollOffset(150, 100)).toBe(100);
    expect(clampScrollOffset(50, -20)).toBe(0);
  });
});

describe("predictShiftedViewport (контейнер сдвинут и ужат на конец анимации)", () => {
  it("подъём сдвигает область целиком", () => {
    expect(
      predictShiftedViewport({
        restTop: 400,
        restHeight: 300,
        shift: { lift: 314, shrink: 0 },
      }),
    ).toEqual({ top: 86, height: 300 });
  });

  it("шторка на всю высоту: верх на месте, область ужимается снизу", () => {
    expect(
      predictShiftedViewport({
        restTop: 120,
        restHeight: 600,
        shift: { lift: 0, shrink: 314 },
      }),
    ).toEqual({ top: 120, height: 286 });
  });

  it("поле встаёт над ужатой областью (над футером), а не под неё", () => {
    const viewport = predictShiftedViewport({
      restTop: 120,
      restHeight: 600,
      shift: { lift: 0, shrink: 314 },
    });

    const offset = computeKeyboardAwareOffset({
      ...base,
      fieldTop: 430,
      fieldBottom: 490,
      visibleTop: viewport.top,
      viewportBottom: viewport.top + viewport.height,
      currentOffset: 0,
    });

    expect(490 - offset).toBeLessThanOrEqual(
      viewport.top + viewport.height - 16,
    );
  });
});

describe("shouldScrollTo", () => {
  it("цель совпадает с текущим положением — scrollTo не вызывается", () => {
    expect(shouldScrollTo(200, 200)).toBe(false);
    expect(shouldScrollTo(200.3, 200)).toBe(false);
  });

  it("цель отличается — двигать", () => {
    expect(shouldScrollTo(212, 200)).toBe(true);
  });
});
