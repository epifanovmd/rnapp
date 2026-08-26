import { ListMetrics } from "../model";

const createMetrics = (estimatedItemSize = 100) =>
  new ListMetrics({ estimatedItemSize });

const keys = (count: number, prefix = "k") =>
  Array.from({ length: count }, (_, index) => `${prefix}${index}`);

const types = (count: number, type = "") =>
  Array.from({ length: count }, () => type);

describe("ListMetrics", () => {
  it("до измерения раскладывает элементы по оценке", () => {
    const metrics = createMetrics(100);

    metrics.setItems(keys(3), types(3));

    expect(metrics.getPosition(0)).toBe(0);
    expect(metrics.getPosition(1)).toBe(100);
    expect(metrics.getPosition(2)).toBe(200);
    expect(metrics.getTotalSize()).toBe(300);
  });

  it("пересчитывает суммарный размер при укорачивании хвоста", () => {
    const metrics = createMetrics(100);

    metrics.setItems(keys(5), types(5));
    expect(metrics.getTotalSize()).toBe(500);

    metrics.setItems(keys(3), types(3));

    expect(metrics.getTotalSize()).toBe(300);
  });

  it("не считает средним по типу элемент, чей размер уже задан", () => {
    const metrics = createMetrics(100);

    metrics.setItems(keys(4), types(4));
    metrics.setMeasuredSize("k0", 40);
    metrics.setMeasuredSize("k1", 40);

    // Переиспользованный контейнер отдаёт новому элементу свою высоту: без неё
    // тот остался бы на среднем и ездил бы при каждом новом измерении.
    metrics.setMeasuredSize("k2", 40);
    metrics.setMeasuredSize("k3", 200);

    expect(metrics.getPosition(2)).toBe(80);
    expect(metrics.getPosition(3)).toBe(120);
    expect(metrics.getTotalSize()).toBe(320);
  });

  it("отличает измерение, меняющее раскладку, от повторного", () => {
    const metrics = createMetrics(100);

    metrics.setItems(keys(3), types(3));

    expect(metrics.willResize("k0", 50)).toBe(true);
    metrics.setMeasuredSize("k0", 50);
    expect(metrics.willResize("k0", 50)).toBe(false);

    // Объявленный размер измерением не перебивается.
    metrics.setFixedSize("k1", 70);
    expect(metrics.willResize("k1", 90)).toBe(false);
  });

  it("сдвигает позиции ниже измеренного элемента", () => {
    const metrics = createMetrics(100);

    metrics.setItems(keys(3), types(3));
    metrics.setMeasuredSize("k0", 50);

    expect(metrics.getPosition(0)).toBe(0);
    expect(metrics.getPosition(1)).toBe(50);
  });

  it("подтягивает оценку соседей того же типа к измеренному размеру", () => {
    const metrics = createMetrics(100);

    metrics.setItems(keys(3), types(3));
    metrics.setMeasuredSize("k0", 50);

    // k1 и k2 не измерены, но их тип уже имеет измерение — оценка идёт по нему.
    expect(metrics.getSize(1)).toBe(50);
    expect(metrics.getPosition(2)).toBe(100);
    expect(metrics.getTotalSize()).toBe(150);
  });

  it("сохраняет измеренные размеры при вставке в начало", () => {
    const metrics = createMetrics(100);

    metrics.setItems(["a", "b"], types(2));
    metrics.setMeasuredSize("a", 30);
    metrics.setMeasuredSize("b", 70);

    metrics.setItems(["new", "a", "b"], types(3));

    expect(metrics.getSizeByKey("a")).toBe(30);
    expect(metrics.getSizeByKey("b")).toBe(70);
    // Вставленный элемент не измерен: его размер — среднее по типу, (30 + 70) / 2.
    expect(metrics.getPosition(1)).toBe(50);
    expect(metrics.getPosition(2)).toBe(80);
  });

  it("возвращает индекс расхождения при смене данных", () => {
    const metrics = createMetrics();

    metrics.setItems(["a", "b", "c"], types(3));

    expect(metrics.setItems(["a", "b", "x"], types(3))).toBe(2);
    expect(metrics.setItems(["z", "b", "x"], types(3))).toBe(0);
  });

  it("оценивает неизмеренный элемент средним по его типу", () => {
    const metrics = createMetrics(100);

    metrics.setItems(["photo1", "photo2", "text1"], ["photo", "photo", "text"]);
    metrics.setMeasuredSize("photo1", 300);

    // photo2 — того же типа, что измеренный photo1, а не общая оценка.
    expect(metrics.getSize(1)).toBe(300);
    // text1 — тип без измерений, остаётся на оценке.
    expect(metrics.getSize(2)).toBe(100);
  });

  it("обновляет среднее при повторном измерении того же элемента", () => {
    const metrics = createMetrics(100);

    metrics.setItems(["a", "b"], ["row", "row"]);
    metrics.setMeasuredSize("a", 200);

    expect(metrics.getSize(1)).toBe(200);

    metrics.setMeasuredSize("a", 400);

    expect(metrics.getSize(1)).toBe(400);
  });

  it("сообщает об изменении раскладки только при новом размере", () => {
    const metrics = createMetrics();

    metrics.setItems(["a"], types(1));

    expect(metrics.setMeasuredSize("a", 50)).toBe(true);
    expect(metrics.setMeasuredSize("a", 50)).toBe(false);
  });

  it("находит элемент по смещению", () => {
    const metrics = createMetrics(100);

    metrics.setItems(keys(5), types(5));

    expect(metrics.findIndexAtOffset(0)).toBe(0);
    expect(metrics.findIndexAtOffset(99)).toBe(0);
    expect(metrics.findIndexAtOffset(100)).toBe(1);
    expect(metrics.findIndexAtOffset(250)).toBe(2);
    expect(metrics.findIndexAtOffset(10000)).toBe(4);
  });

  it("не падает на пустых данных", () => {
    const metrics = createMetrics();

    metrics.setItems([], []);

    expect(metrics.getTotalSize()).toBe(0);
    expect(metrics.findIndexAtOffset(100)).toBe(0);
    expect(metrics.getCount()).toBe(0);
  });

  it("учитывает объявленные размеры без измерения", () => {
    const metrics = createMetrics(100);

    metrics.setItems(["a", "b"], types(2));
    metrics.setFixedSize("a", 20);

    expect(metrics.hasMeasured("a")).toBe(true);
    expect(metrics.getPosition(1)).toBe(20);
  });

  it("отдаёт позицию по ключу", () => {
    const metrics = createMetrics(100);

    metrics.setItems(["a", "b"], types(2));

    expect(metrics.getPositionByKey("b")).toBe(100);
    expect(metrics.getPositionByKey("missing")).toBeUndefined();
  });
});

describe("ListMetrics — объявленные размеры", () => {
  it("не перебивает объявленный размер измерением", () => {
    const metrics = new ListMetrics({ estimatedItemSize: 100 });

    metrics.setItems(["a", "b"], ["", ""]);
    metrics.setFixedSize("a", 120);

    // Фактическая высота приходит округлённой к пикселям устройства.
    expect(metrics.setMeasuredSize("a", 120.33)).toBe(false);
    expect(metrics.getSize(0)).toBe(120);
    expect(metrics.getPosition(1)).toBe(120);
  });

  it("принимает измерение у строки без объявленного размера", () => {
    const metrics = new ListMetrics({ estimatedItemSize: 100 });

    metrics.setItems(["a"], [""]);

    expect(metrics.setMeasuredSize("a", 120.33)).toBe(true);
    expect(metrics.getSize(0)).toBe(120.33);
  });
});
