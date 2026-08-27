import { PrefixPositions } from "../prefix-positions";

/** Стенд: размеры задаются массивом, длина списка берётся из него же. */
const createPositions = (sizes: number[]) => {
  const state = { sizes };
  const positions = new PrefixPositions({
    getCount: () => state.sizes.length,
    getSize: index => state.sizes[index] ?? 0,
  });

  return { positions, state };
};

describe("PrefixPositions", () => {
  it("раскладывает элементы подряд", () => {
    const { positions } = createPositions([100, 50, 200]);

    positions.markDirty(0);

    expect(positions.getPosition(0)).toBe(0);
    expect(positions.getPosition(1)).toBe(100);
    expect(positions.getPosition(2)).toBe(150);
    expect(positions.getTotal()).toBe(350);
  });

  it("пересчитывает только с грязного индекса", () => {
    const { positions, state } = createPositions([100, 100, 100]);

    positions.markDirty(0);
    positions.flush();

    state.sizes[1] = 300;
    positions.markDirty(1);

    expect(positions.getPosition(0)).toBe(0);
    expect(positions.getPosition(2)).toBe(400);
    expect(positions.getTotal()).toBe(500);
  });

  it("не опускает грязную границу выше уже отмеченной", () => {
    const { positions, state } = createPositions([100, 100, 100]);

    positions.markDirty(0);
    positions.flush();

    state.sizes[0] = 10;
    positions.markDirty(0);
    positions.markDirty(2);

    expect(positions.getTotal()).toBe(210);
  });

  it("пересчитывает суммарный размер при укорачивании хвоста", () => {
    const { positions, state } = createPositions([100, 100, 100, 100, 100]);

    positions.markDirty(0);
    expect(positions.getTotal()).toBe(500);

    // Хвост удалён, но позиции оставшихся не изменились: грязным становится
    // конец списка, и суммарный размер обязан посчитаться заново.
    state.sizes = [100, 100, 100];
    positions.markDirty(3);

    expect(positions.getTotal()).toBe(300);
  });

  it("не падает на пустом списке", () => {
    const { positions } = createPositions([]);

    positions.markDirty(0);

    expect(positions.getTotal()).toBe(0);
    expect(positions.getPosition(0)).toBe(0);
    expect(positions.findIndexAtOffset(100)).toBe(0);
  });

  it("находит элемент по смещению бинарным поиском", () => {
    const { positions } = createPositions([100, 100, 100, 100, 100]);

    positions.markDirty(0);

    expect(positions.findIndexAtOffset(0)).toBe(0);
    expect(positions.findIndexAtOffset(99)).toBe(0);
    expect(positions.findIndexAtOffset(100)).toBe(1);
    expect(positions.findIndexAtOffset(250)).toBe(2);
    expect(positions.findIndexAtOffset(10000)).toBe(4);
  });
});
