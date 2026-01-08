import { IApiService } from "@api";
import { DialogDto, GetDialogsParams } from "@api/api-gen/data-contracts";
import { TimeoutManager } from "@common";
import {
  disposer,
  InitializeDispose,
  ListCollectionHolder,
} from "@force-dev/utils";
import type { ViewToken } from "@react-native/virtualized-lists";
import { ISocketService } from "@service";
import { makeAutoObservable } from "mobx";

import { IChatDataStore } from "../chat";
import { IDialogsDataStore } from "./DialogsData.types";

@IDialogsDataStore()
export class DialogsDataStore implements IDialogsDataStore {
  private _holder = new ListCollectionHolder<
    DialogDto & { online?: boolean },
    GetDialogsParams
  >();

  private _timeoutManager = new TimeoutManager(5000);

  constructor(
    @IApiService() private _apiService: IApiService,
    @ISocketService() private _socketService: ISocketService,
    @IChatDataStore() private _msgDs: IChatDataStore,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    this._holder.initialize({
      onFetchData: args =>
        this._apiService
          .getDialogs(args)
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

    this.refresh().then();

    this._socketService.on("online", ({ userId, isOnline }) => {
      this._holder.updateData(
        this.data.map(item =>
          item.participants.some(member => member.userId === userId)
            ? {
                ...item,
                online: isOnline,
              }
            : item,
        ),
        { replace: true },
      );

      this._timeoutManager.addTimeout(userId, () => {
        this._holder.updateData(
          this.data.map(item =>
            item.participants.some(member => member.userId === userId)
              ? {
                  ...item,
                  online: false,
                }
              : item,
          ),
          { replace: true },
        );
      });
    });

    this._socketService.on("message", ({ dialogId, ...rest }) => {
      const dialog = this.data.find(item => item.id === dialogId);

      if (dialog) {
        this._holder.updateData(
          [
            {
              ...dialog,
              lastMessage: {
                id: rest.id,
                text: rest.text,
                createdAt: rest.createdAt,
                updatedAt: rest.updatedAt,
                received: rest.received,
              },
              unreadMessagesCount: dialog.unreadMessagesCount + 1,
            },
            ...this.data.filter(item => item.id !== dialogId),
          ],
          { replace: true },
        );
      }
    });

    const disposers = new Set<InitializeDispose>();

    disposers.add(
      this._socketService.on("newDialog", async dialogId => {
        const res = await this._apiService.getDialogById(dialogId);

        if (res.data) {
          this._appendDialog(res.data);
        }
      }),
    );

    disposers.add(
      this._socketService.on("deleteDialog", id => {
        this._holder.updateData(
          this.data.filter(item => item.id !== id),
          { replace: true },
        );
      }),
    );

    return () => {
      disposer(Array.from(disposers));
      disposers.clear();

      this._holder.clear();
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

  async create(userId: string) {
    const response = await this._apiService.createDialog({
      recipientId: [userId],
    });

    if (response.data) {
      this._appendDialog(response.data);
    }
  }

  async delete(dialogId: string) {
    const response = await this._apiService.removeDialog(dialogId);

    if (response.data) {
      this._holder.updateData(
        this.data.filter(msg => msg.id !== dialogId),
        { replace: true },
      );
    }
  }

  onViewableItemsChanged(info: {
    viewableItems: Array<ViewToken<DialogDto>>;
    changed: Array<ViewToken<DialogDto>>;
  }) {
    info.viewableItems.forEach(({ item: { id } }) => {
      const messagesDataStore = this._msgDs(id);

      if (!messagesDataStore.isInitialized) {
        messagesDataStore.initialize(id);
      }
    });
  }

  loadMore() {
    return this._holder.performLoadMore();
  }

  refresh() {
    return this._holder.performRefresh();
  }

  private _appendDialog(dialog: DialogDto) {
    this._holder.updateData(
      [
        {
          id: dialog.id,
          lastMessage: dialog.lastMessage,
          participants: dialog.participants,
          ownerId: dialog.ownerId,
          createdAt: dialog.createdAt,
          updatedAt: dialog.updatedAt,
          unreadMessagesCount: dialog.unreadMessagesCount,
        },
        ...this.data,
      ],
      { replace: true },
    );
  }
}
