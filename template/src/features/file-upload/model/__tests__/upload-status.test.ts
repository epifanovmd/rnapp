import { describeUpload } from "../upload-status";

describe("describeUpload", () => {
  it("отправка — процент", () => {
    expect(describeUpload({ progress: 0.42, queue: null })).toEqual({
      text: "Загрузка 42%",
      indeterminate: false,
    });
  });

  it("отправка в пачке — номер файла и процент", () => {
    expect(
      describeUpload({ progress: 0.5, queue: { index: 2, count: 5 } }).text,
    ).toBe("Загрузка 2 из 5 · 50%");
  });

  it("файл отправлен целиком — обработка на сервере, бегущая полоса", () => {
    expect(describeUpload({ progress: 1, queue: null })).toEqual({
      text: "Обработка на сервере…",
      indeterminate: true,
    });
  });

  it("обработка в пачке — с номером файла", () => {
    expect(
      describeUpload({ progress: 1, queue: { index: 3, count: 4 } }).text,
    ).toBe("Обработка на сервере… 3 из 4");
  });
});
