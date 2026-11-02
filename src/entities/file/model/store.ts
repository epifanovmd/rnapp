import { IMainApi, toHolderPage } from "@shared/api";
import type { IFileDto } from "@shared/api/gen/main/model";
import { ILocalFile, toFormFile } from "@shared/lib/files";
import { InfiniteHolder } from "@shared/lib/holders";
import {
  ApiError,
  ApiResponse,
  mapCancelable,
  UnknownApiError,
} from "@shared/lib/http";
import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import { IFileStore, IUploadManyResult, IUploadQueueState } from "./types";

const PAGE_SIZE = 20;

@injectable()
export class FileStore implements IFileStore {
  public filesHolder = new InfiniteHolder<IFileDto>({
    keyExtractor: file => file.id,
    pageSize: PAGE_SIZE,
    onFetch: ({ offset, limit }) =>
      mapCancelable(
        this._api.getMyFiles({ mine: this.mine, offset, limit }),
        toHolderPage,
      ),
  });

  /** Список только своих файлов; `false` — все, если есть право `file:view`. */
  public mine = true;

  /** Доля отправленного файла 0..1; `null` — загрузки нет. */
  public uploadProgress: number | null = null;
  /** Номер текущего файла в пачке; `null` — пачки нет. */
  public uploadQueue: IUploadQueueState | null = null;

  constructor(@IMainApi() private _api: IMainApi) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get files() {
    return this.filesHolder.items;
  }

  get isUploading() {
    return this.uploadProgress !== null || this.uploadQueue !== null;
  }

  get images() {
    if (!this.mine) return [];

    return this.files.filter(file => file.type.startsWith("image/"));
  }

  async setMine(mine: boolean) {
    if (this.mine === mine) return;

    this.mine = mine;
    this.filesHolder.reset();
    await this.filesHolder.load();
  }

  async load() {
    await this.filesHolder.load();
  }

  async refresh() {
    await this.filesHolder.refresh();
  }

  async loadMore() {
    await this.filesHolder.loadMore();
  }

  async upload(file: ILocalFile): Promise<ApiResponse<IFileDto, ApiError>> {
    this._setUploadProgress(0);

    const res = await this._api.uploadFile(
      { file: toFormFile(file) },
      {
        onUploadProgress: ({ ratio }) =>
          this._setUploadProgress(ratio ?? this.uploadProgress),
      },
    );

    this._setUploadProgress(null);

    if (res.error) return { error: res.error };

    const [uploaded] = res.data;

    if (!uploaded) {
      return {
        error: new UnknownApiError("Сервер не вернул загруженный файл"),
      };
    }

    this.filesHolder.prependIfNotExists(uploaded.id, uploaded);

    return { data: uploaded };
  }

  async uploadMany(files: readonly ILocalFile[]): Promise<IUploadManyResult> {
    const result: IUploadManyResult = { uploaded: [], errors: [] };

    for (const [index, file] of files.entries()) {
      this._setUploadQueue({ index: index + 1, count: files.length });

      const res = await this.upload(file);

      if (res.data) result.uploaded.push(res.data);
      if (res.error) result.errors.push(res.error);
    }

    this._setUploadQueue(null);

    return result;
  }

  async remove(id: string) {
    const res = await this._api.deleteFile(id);

    if (!res.error) {
      this.filesHolder.removeItem(id);
    }

    return res;
  }

  handleFileUploaded(file: IFileDto) {
    this.filesHolder.prependIfNotExists(file.id, file);
  }

  handleFileDeleted(id: string) {
    this.filesHolder.removeItem(id);
  }

  handleFileProcessed(file: IFileDto) {
    if (this.filesHolder.exists(file.id)) {
      this.filesHolder.updateItem(file.id, file);
    }
  }

  reset() {
    this.filesHolder.reset();
    this.mine = true;
    this.uploadProgress = null;
    this.uploadQueue = null;
  }

  private _setUploadQueue(value: IUploadQueueState | null) {
    this.uploadQueue = value;
  }

  private _setUploadProgress(value: number | null) {
    this.uploadProgress = value;
  }
}
