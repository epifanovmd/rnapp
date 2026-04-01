import { IApiService } from "@api";
import {
  ChatFolderDto,
  ICreateFolderBody,
  IUpdateFolderBody,
} from "@api/api-gen/data-contracts";
import { CollectionHolder, MutationHolder } from "@store/holders";
import { createModelMapper, FolderModel } from "@store/models";
import { makeAutoObservable } from "mobx";

import { IChatFolderStore } from "./ChatFolderStore.types";

@IChatFolderStore({ inSingleton: true })
export class ChatFolderStore implements IChatFolderStore {
  public foldersHolder = new CollectionHolder<ChatFolderDto>({
    keyExtractor: f => f.id,
  });

  public createMutation = new MutationHolder<ICreateFolderBody, ChatFolderDto>({
    onMutate: async args => {
      const res = await this._api.createFolder(args);

      if (res.data) {
        this.foldersHolder.appendItem(res.data);
      }

      return res;
    },
  });
  public updateMutation = new MutationHolder<
    IUpdateFolderBody,
    ChatFolderDto
  >();
  public deleteMutation = new MutationHolder<string>({
    onMutate: async id => {
      const res = await this._api.deleteFolder({ folderId: id });

      if (!res.error) {
        this.foldersHolder.removeItem(id);
      }

      return res;
    },
  });

  private _toModels = createModelMapper<ChatFolderDto, FolderModel>(
    f => f.id,
    f => new FolderModel(f),
  );

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get folders(): ChatFolderDto[] {
    return this.foldersHolder.items;
  }

  get folderModels() {
    return this._toModels(this.foldersHolder.items);
  }

  get isLoading(): boolean {
    return this.foldersHolder.isLoading;
  }

  async load(): Promise<void> {
    await this.foldersHolder.fromApi(() => this._api.getUserFolders());
  }

  async createFolder(name: string): Promise<void> {
    await this.createMutation.execute({ name });
  }

  async updateFolder(folderId: string, name: string): Promise<void> {
    await this.updateMutation.execute({ name }, async args => {
      const res = await this._api.updateFolder({ folderId }, args);

      if (res.data) {
        this.foldersHolder.updateItem(f => f.id === folderId, res.data);
      }

      return res;
    });
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.deleteMutation.execute(folderId);
  }
}
