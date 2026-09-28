import { assetToLocalFile, documentToLocalFile } from "../to-local-file";

describe("assetToLocalFile", () => {
  it("фото с именем, типом и размером", () => {
    expect(
      assetToLocalFile({
        uri: "file:///tmp/IMG_1.HEIC",
        fileName: "IMG_1.HEIC",
        type: "image/heic",
        fileSize: 1200,
      }),
    ).toEqual({
      uri: "file:///tmp/IMG_1.HEIC",
      name: "IMG_1.HEIC",
      type: "image/heic",
      size: 1200,
    });
  });

  it("без имени и типа — имя из пути, тип jpeg", () => {
    expect(assetToLocalFile({ uri: "file:///tmp/photo%201.jpg" })).toEqual({
      uri: "file:///tmp/photo%201.jpg",
      name: "photo 1.jpg",
      type: "image/jpeg",
    });
  });

  it("без uri — пропуск", () => {
    expect(assetToLocalFile({ fileName: "x.jpg" })).toBeNull();
  });
});

describe("documentToLocalFile", () => {
  it("локальная копия с именем и типом оригинала", () => {
    expect(
      documentToLocalFile(
        { name: "report.pdf", type: "application/pdf", size: 10 },
        "file:///cache/report.pdf",
      ),
    ).toEqual({
      uri: "file:///cache/report.pdf",
      name: "report.pdf",
      type: "application/pdf",
      size: 10,
    });
  });

  it("неизвестный тип — application/octet-stream", () => {
    expect(
      documentToLocalFile(
        { name: null, type: null, size: null },
        "file:///cache/data.bin",
      ),
    ).toEqual({
      uri: "file:///cache/data.bin",
      name: "data.bin",
      type: "application/octet-stream",
    });
  });
});
