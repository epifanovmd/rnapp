import { ChatFolderDto, ICreateFolderBody } from "@api/api-gen/data-contracts";
import { createServiceDecorator } from "@di";
import { CollectionHolder, MutationHolder } from "@store/holders";

export const IChatFolderStore = createServiceDecorator<IChatFolderStore>();

export interface IChatFolderStore {
  foldersHolder: CollectionHolder<ChatFolderDto>;
  createMutation: MutationHolder<ICreateFolderBody, ChatFolderDto>;
  deleteMutation: MutationHolder<string>;

  folders: ChatFolderDto[];
  isLoading: boolean;

  load(): Promise<void>;
  createFolder(name: string): Promise<void>;
  updateFolder(folderId: string, name: string): Promise<void>;
  deleteFolder(folderId: string): Promise<void>;
}
