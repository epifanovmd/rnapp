import { IApiService } from "@api";
import {
  DeleteFileParams,
  GetFileByIdParams,
  IFileDto,
} from "@api/api-gen/data-contracts";
import { EntityHolder, MutationHolder } from "@store/holders";
import { makeAutoObservable } from "mobx";

import { IFileUploadStore } from "./FileUploadStore.types";

@IFileUploadStore({ inSingleton: true })
export class FileUploadStore implements IFileUploadStore {
  public fileHolder = new EntityHolder<IFileDto, GetFileByIdParams>({
    onFetch: args => this._api.getFileById(args),
  });
  public uploadMutation = new MutationHolder<File, IFileDto[]>({
    onMutate: async f => {
      return this._api.uploadFile({ file: f });
    },
  });
  public deleteMutation = new MutationHolder<DeleteFileParams, boolean>({
    onMutate: async args => {
      return this._api.deleteFile(args);
    },
  });

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isUploading(): boolean {
    return this.uploadMutation.isLoading;
  }

  async upload(file: File): Promise<IFileDto[]> {
    const result = await this.uploadMutation.execute(file, async f => {
      return this._api.uploadFile({ file: f });
    });

    if (result.error || !result.data) {
      throw new Error(result.error?.message ?? "Ошибка загрузки файла");
    }

    return result.data;
  }

  async uploadMultiple(files: File[]): Promise<IFileDto[]> {
    const results: IFileDto[] = [];

    for (const file of files) {
      const uploaded = await this.upload(file);

      results.push(...uploaded);
    }

    return results;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.deleteMutation.execute({ id: fileId });
  }

  async getFile(fileId: string) {
    return this.fileHolder.load({ id: fileId });
  }
}
