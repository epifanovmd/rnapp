import { getBlankArea } from "../blank-area";

const blank = (spans: { position: number; size: number }[]) =>
  getBlankArea({ spans, viewportTop: 100, viewportEnd: 500 });

describe("getBlankArea", () => {
  it("считает вьюпорт пустым без контейнеров", () => {
    expect(blank([])).toBe(400);
  });

  it("не видит пустоты у закрытого вьюпорта", () => {
    expect(blank([{ position: 0, size: 600 }])).toBe(0);
  });

  it("считает дыру между строками", () => {
    expect(
      blank([
        { position: 100, size: 100 },
        { position: 300, size: 200 },
      ]),
    ).toBe(100);
  });

  it("не считает перекрытие дважды", () => {
    // Прилипший контейнер стоит поверх соседа: сумма длин дала бы отрицательную
    // пустоту.
    expect(
      blank([
        { position: 100, size: 300 },
        { position: 150, size: 100 },
        { position: 400, size: 100 },
      ]),
    ).toBe(0);
  });

  it("считает только часть отрезка внутри вьюпорта", () => {
    expect(blank([{ position: -1000, size: 1150 }])).toBe(350);
  });

  it("не считает уведённые за пределы контента", () => {
    expect(blank([{ position: -10000000, size: 100 }])).toBe(400);
  });

  it("отдаёт ноль на схлопнутом вьюпорте", () => {
    expect(
      getBlankArea({ spans: [], viewportTop: 100, viewportEnd: 100 }),
    ).toBe(0);
  });

  it("считает хвост вьюпорта ниже последней строки", () => {
    expect(blank([{ position: 100, size: 250 }])).toBe(150);
  });
});
