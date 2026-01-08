import { DialogDto } from "@api/api-gen/data-contracts";
import { iocHook } from "@force-dev/react";
import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";
import type { ViewToken } from "@react-native/virtualized-lists";

export interface IDialogsDataStore extends SupportInitialize {
  data: (DialogDto & { online?: boolean })[];
  isLoading: boolean;
  isLoadingMore: boolean;

  create(userId: string): Promise<void>;
  delete(dialogId: string): Promise<void>;
  onViewableItemsChanged(info: {
    viewableItems: Array<ViewToken<DialogDto>>;
    changed: Array<ViewToken<DialogDto>>;
  }): void;
  refresh(): Promise<DialogDto[]>;
  loadMore(): Promise<DialogDto[]>;
}

export const IDialogsDataStore = createServiceDecorator<IDialogsDataStore>();
export const useDialogsDataStore = iocHook(IDialogsDataStore);
