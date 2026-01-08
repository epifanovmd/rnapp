import {
  DialogDto,
  DialogMessagesDto,
  IMessagesRequestDto,
} from "@api/api-gen/data-contracts";
import { IMessage } from "@components/chat";
import { iocHook } from "@force-dev/react";
import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";
import { Factory } from "inversify";

export interface BaseChatDataStore extends SupportInitialize<string> {
  dialog: DialogDto | undefined;
  messages: DialogMessagesDto[];

  isInitialized: boolean;
  isOnline: boolean;
  isTyping: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;

  handleTyping(text: string): void;
  handleViewableMessages(messages: IMessage[]): void;
  loadingMore(): Promise<void>;
  sendMessage(message: IMessagesRequestDto): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
}

export const IChatDataStore =
  createServiceDecorator<Factory<BaseChatDataStore>>();
export type IChatDataStore = Factory<BaseChatDataStore>;
export const useChatDataStore = iocHook(IChatDataStore);
