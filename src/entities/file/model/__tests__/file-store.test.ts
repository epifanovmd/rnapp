import type { IMainApi } from "@shared/api";
import type { IFileDto } from "@shared/api/gen/main/model";
import type { EFileStatus as TFileStatus } from "@shared/api/gen/main/model";
import { EFileStatus } from "@shared/api/gen/main/model";

import { FileStore } from "../store";

const file = (
  id: string,
  type = "image/jpeg",
  status: TFileStatus = EFileStatus.ready,
) =>
  ({
    id,
    ownerId: "u1",
    name: `${id}.jpg`,
    type,
    size: 10,
    status,
    url: null,
    downloadUrl: null,
    thumbnailUrl: null,
    mediumUrl: null,
    blurhash: null,
    width: null,
    height: null,
    duration: null,
    waveform: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }) as IFileDto;

const local = { uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg" };

describe("FileStore", () => {
  it("загруженный файл встаёт в начало списка", async () => {
    const uploadFile = jest.fn(async () => ({ data: [file("f2")] }));
    const store = new FileStore({ uploadFile } as unknown as IMainApi);

    store.filesHolder.setItems([file("f1")], false);

    const res = await store.upload(local);

    expect(uploadFile).toHaveBeenCalledWith(
      { file: local },
      { onUploadProgress: expect.any(Function) },
    );
    expect(res.data?.id).toBe("f2");
    expect(store.files.map(f => f.id)).toEqual(["f2", "f1"]);
    expect(store.isUploading).toBe(false);
  });

  it("удалённый файл пропадает из списка", async () => {
    const store = new FileStore({
      deleteFile: jest.fn(async () => ({ data: undefined })),
    } as unknown as IMainApi);

    store.filesHolder.setItems([file("f1"), file("f2")], false);
    await store.remove("f1");

    expect(store.files.map(f => f.id)).toEqual(["f2"]);
  });

  it("file:processed обновляет только известный файл", () => {
    const store = new FileStore({} as IMainApi);

    store.filesHolder.setItems(
      [file("f1", "image/jpeg", EFileStatus.processing)],
      false,
    );
    store.handleFileProcessed(file("f1"));
    store.handleFileProcessed(file("f9"));

    expect(store.files.map(f => [f.id, f.status])).toEqual([
      ["f1", EFileStatus.ready],
    ]);
  });

  it("file:uploaded с другого устройства встаёт в начало, без дублей", () => {
    const store = new FileStore({} as IMainApi);

    store.filesHolder.setItems([file("f1")], false);
    store.handleFileUploaded(file("f2"));
    store.handleFileUploaded(file("f2"));

    expect(store.files.map(f => f.id)).toEqual(["f2", "f1"]);
  });

  it("file:deleted убирает файл из списка", () => {
    const store = new FileStore({} as IMainApi);

    store.filesHolder.setItems([file("f1"), file("f2")], false);
    store.handleFileDeleted("f1");

    expect(store.files.map(f => f.id)).toEqual(["f2"]);
  });

  it("прогресс загрузки — доля отправленного, после ответа сброшен", async () => {
    let finish: (value: unknown) => void = () => {};
    let report: (progress: {
      loaded: number;
      ratio?: number;
    }) => void = () => {};
    const store = new FileStore({
      uploadFile: jest.fn((_body, options) => {
        report = options.onUploadProgress;

        return new Promise(resolve => {
          finish = resolve;
        });
      }),
    } as unknown as IMainApi);

    const done = store.upload({
      uri: "file:///a.png",
      name: "a.png",
      type: "image/png",
    });

    expect(store.uploadProgress).toBe(0);
    report({ loaded: 5, ratio: 0.5 });
    expect(store.uploadProgress).toBe(0.5);

    finish({ data: [file("f1")], error: null });
    await done;
    expect(store.uploadProgress).toBeNull();
  });

  it("очередь: файлы по одному, номер в пачке, ошибка не останавливает остальные", async () => {
    const seen: (string | null)[] = [];
    let store: FileStore;
    const uploadFile = jest.fn(
      async ({ file: sent }: { file: { name: string } }) => {
        seen.push(
          store.uploadQueue &&
            `${store.uploadQueue.index}/${store.uploadQueue.count}`,
        );

        return sent.name === "bad.png"
          ? { data: null, error: { message: "415" } }
          : { data: [file(sent.name)] };
      },
    );

    store = new FileStore({ uploadFile } as unknown as IMainApi);

    const result = await store.uploadMany([
      { uri: "file:///a", name: "a.png", type: "image/png" },
      { uri: "file:///b", name: "bad.png", type: "image/png" },
      { uri: "file:///c", name: "c.png", type: "image/png" },
    ]);

    expect(seen).toEqual(["1/3", "2/3", "3/3"]);
    expect(result.uploaded.map(f => f.id)).toEqual(["a.png", "c.png"]);
    expect(result.errors).toHaveLength(1);
    expect(store.uploadQueue).toBeNull();
    expect(store.isUploading).toBe(false);
  });

  it("изображения — только файлы с image/* типом", () => {
    const store = new FileStore({} as IMainApi);

    store.filesHolder.setItems([file("f1"), file("f2", "text/plain")], false);

    expect(store.images.map(f => f.id)).toEqual(["f1"]);
  });
  it("список «все файлы» грузится заново с mine=false, без кандидатов в аватар", async () => {
    const page = (items: IFileDto[]) =>
      Object.assign(
        Promise.resolve({
          data: { items, total: items.length, offset: 0, limit: 20 },
        }),
        { cancel: jest.fn() },
      );
    const getMyFiles = jest.fn(({ mine }: { mine: boolean }) =>
      page(mine ? [file("f1")] : [file("f1"), file("f2")]),
    );
    const store = new FileStore({ getMyFiles } as unknown as IMainApi);

    await store.load();
    expect(getMyFiles).toHaveBeenLastCalledWith({
      mine: true,
      offset: 0,
      limit: 20,
    });

    await store.setMine(false);
    expect(getMyFiles).toHaveBeenLastCalledWith({
      mine: false,
      offset: 0,
      limit: 20,
    });
    expect(store.files.map(f => f.id)).toEqual(["f1", "f2"]);
    expect(store.images).toEqual([]);

    store.reset();
    expect(store.mine).toBe(true);
  });
});
