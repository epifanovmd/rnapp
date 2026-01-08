import {
  DialogMessagesDto,
  IMessagesRequestDto,
} from "@api/api-gen/data-contracts";
import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";

export interface IMessagesDataStore extends SupportInitialize<string> {
  data: DialogMessagesDto[];
  isLoading: boolean;
  isLoadingMore: boolean;

  send(message: IMessagesRequestDto): Promise<void>;
  delete(messageId: string): Promise<void>;
  refresh(): Promise<DialogMessagesDto[]>;
  loadMore(): Promise<DialogMessagesDto[]>;
}

export const IMessagesDataStore = createServiceDecorator<IMessagesDataStore>();
