import { IApiService } from "@api";
import {
  DialogMessagesDto,
  GetMessagesParams,
  IMessagesRequestDto,
  PublicUserDto,
} from "@api/api-gen/data-contracts";
import {
  disposer,
  InitializeDispose,
  ListCollectionHolder,
} from "@force-dev/utils";
import { ISocketService } from "@service";
import { makeAutoObservable } from "mobx";

import { IUserDataStore } from "../user";
import { IMessagesDataStore } from "./MessagesData.types";

@IMessagesDataStore()
export class MessagesDataStore implements IMessagesDataStore {
  private _holder = new ListCollectionHolder<
    DialogMessagesDto,
    Omit<GetMessagesParams, "dialogId">
  >();

  constructor(
    @IApiService() private _apiService: IApiService,
    @IUserDataStore() private _userDataStore: IUserDataStore,
    @ISocketService() private _socketService: ISocketService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize(dialogId: string) {
    this._holder.initialize({
      onFetchData: args =>
        this._apiService
          .getMessages({ dialogId, ...args })
          .then(res => {
            const data = res.data?.data ?? [];

            this._holder.updateData(data);

            return data;
          })
          .catch(reason => {
            if (reason instanceof Error) {
              this._holder.setError(reason.message);
            }

            return [];
          }),
      keyExtractor: item => item.id,
      pageSize: 20,
    });

    const disposers = new Set<InitializeDispose>();

    disposers.add(
      this._socketService.on("message", args => {
        this._holder.updateData([args, ...this.data], { replace: true });
      }),
    );

    disposers.add(
      this._socketService.on(
        "messageReceived",
        ({ messageIds, dialogId: _dialogId }) => {
          if (dialogId === _dialogId) {
            this._holder.updateData(
              this.data.map(item =>
                messageIds.includes(item.id)
                  ? { ...item, received: true }
                  : item,
              ),
              { replace: true },
            );
          }
        },
      ),
    );

    disposers.add(
      this._socketService.on("deleteMessage", (id, messageId) => {
        if (dialogId === id) {
          this._holder.updateData(
            this.data.filter(item => item.id !== messageId),
            { replace: true },
          );
        }
      }),
    );

    return () => {
      disposer(Array.from(disposers));
      disposers.clear();

      // this._holder.clear();
    };
  }

  get data() {
    return this._holder.d;
  }

  get isLoading() {
    return this._holder.isLoading;
  }

  get isLoadingMore() {
    return this._holder.isLoadingMore;
  }

  async send(message: IMessagesRequestDto) {
    const user = this._userDataStore.user;

    if (!user) {
      return;
    }
    const replyMessage = this.data.find(msg => msg.id === message.replyId);

    this._holder.updateData(
      [
        {
          text: message.text,
          userId: user.id,
          dialogId: message.dialogId,
          id: "-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            userId: user.id,
            email: user.profile?.firstName ?? user.email,
            profile: {
              avatar: user?.profile?.avatar?.url,
            },
          } as PublicUserDto,

          reply: replyMessage,
        },
        ...this.data,
      ],
      { replace: true },
    );
    const response = await this._apiService.newMessage(message);

    if (response.data) {
      this._holder.updateData(
        this.data.map(msg =>
          msg.id === "-1" && msg.text === response.data?.text
            ? response.data
            : msg,
        ),
        { replace: true },
      );
    }
  }

  async delete(messageId: string) {
    const response = await this._apiService.deleteMessage(messageId);

    if (response.data) {
      this._holder.updateData(
        this.data.filter(msg => msg.id !== messageId),
        { replace: true },
      );
    }
  }

  loadMore() {
    return this._holder.performLoadMore();
  }

  refresh() {
    return this._holder.performRefresh();
  }
}
