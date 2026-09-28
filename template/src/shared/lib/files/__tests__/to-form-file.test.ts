import { toFileUri, toFormFile } from "../to-form-file";

describe("toFileUri", () => {
  it("добавляет схему к пути", () => {
    expect(toFileUri("/cache/a.txt")).toBe("file:///cache/a.txt");
  });

  it("не дублирует схему", () => {
    expect(toFileUri("file:///cache/a.txt")).toBe("file:///cache/a.txt");
  });
});

describe("toFormFile", () => {
  it("отдаёт дескриптор файла для FormData", () => {
    const file = { uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg" };

    expect(toFormFile(file)).toEqual(file);
  });
});
