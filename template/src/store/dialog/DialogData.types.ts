import { DialogDto } from "@api/api-gen/data-contracts";
import { iocHook } from "@force-dev/react";
import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";

export interface IDialogDataStore extends SupportInitialize<string> {
  dialogId: string;
  data: DialogDto | undefined;
  isLoading: boolean;

  refresh(): Promise<void>;
}

export const IDialogDataStore = createServiceDecorator<IDialogDataStore>();
export const useDialogDataStore = iocHook(IDialogDataStore);
