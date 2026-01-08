import { IMessagesRequestDto } from "@api/api-gen/data-contracts";
import { IMessage } from "@components/chat";
import {
  disposer,
  InitializeDispose,
  iocContainer,
  Timeout,
} from "@force-dev/utils";
import { ISocketService } from "@service";
import { Factory } from "inversify";
import { makeAutoObservable, runInAction } from "mobx";

import { IDialogDataStore } from "../dialog";
import { IMessagesDataStore } from "../messages";
import { IUserDataStore } from "../user";
import { BaseChatDataStore, IChatDataStore } from "./ChatData.types";

const timeout = new Timeout({ timeout: 10000 });

// @IChatDataStore()
export class ChatDataStore implements BaseChatDataStore {
  isInitialized = false;
  isOnline = false;
  isTyping = false;

  constructor(
    @IMessagesDataStore() private _messagesDataStore: IMessagesDataStore,
    @IDialogDataStore() private _dialogDataStore: IDialogDataStore,
    @IUserDataStore() private _userDataStore: IUserDataStore,
    @ISocketService() private _socketService: ISocketService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async initialize(dialogId: string) {
    const disposers = new Set<InitializeDispose>();

    disposers.add(this._dialogDataStore.initialize(dialogId));
    disposers.add(this._messagesDataStore.initialize(dialogId));

    await Promise.all([
      this._dialogDataStore.refresh(),
      this._messagesDataStore.refresh(),
    ]);

    runInAction(() => {
      this.isInitialized = true;
    });

    const user =
      this._userDataStore.user ?? (await this._userDataStore.getUser());

    disposers.add(
      this._socketService.on("online", args => {
        if (args.userId !== user?.id) {
          timeout.stop();

          this.setIsOnline(args.isOnline);
          timeout.start(() => {
            this.setIsOnline(false);
          });
        }
      }),
    );

    disposers.add(
      this._socketService.on("typing", ({ isTyping }) => {
        this.setIsTyping(isTyping);
      }),
    );

    return () => {
      disposer(Array.from(disposers));
      disposers.clear();
    };
  }

  get isLoading() {
    return this._dialogDataStore.isLoading || this._messagesDataStore.isLoading;
  }

  get isLoadingMore() {
    return this._messagesDataStore.isLoadingMore;
  }

  get dialog() {
    return this._dialogDataStore.data;
  }

  get messages() {
    return this._messagesDataStore.data;
  }

  get dialogId() {
    return this._dialogDataStore.dialogId;
  }

  handleTyping(text: string) {
    if (text) {
      this._socketService.emit("typing", this.dialogId).then();
    }
  }

  handleViewableMessages(messages: IMessage[]) {
    this._socketService
      .emit(
        "messageReceived",
        messages
          .filter(item => item.user.id !== this._userDataStore.user?.id)
          .map(item => item.id),
        this.dialogId,
      )
      .then();
  }

  async loadingMore() {
    await this._messagesDataStore.loadMore();
  }

  async sendMessage(message: IMessagesRequestDto) {
    await this._messagesDataStore.send(message);
  }

  async deleteMessage(messageId: string) {
    await this._messagesDataStore.delete(messageId);
  }

  setIsOnline(isOnline: boolean) {
    this.isOnline = isOnline;
  }

  setIsTyping(isTyping: boolean) {
    this.isTyping = isTyping;
  }
}

iocContainer
  .bind<Factory<IChatDataStore>>(IChatDataStore.Tid)
  .toFactory(context => {
    return (dialogId: string) => {
      const tid = IChatDataStore.Tid + dialogId;

      if (iocContainer.isBound(tid)) {
        return context.get(tid);
      }

      iocContainer.bind(tid).to(ChatDataStore).inSingletonScope();

      return context.get(tid);
    };
  });
