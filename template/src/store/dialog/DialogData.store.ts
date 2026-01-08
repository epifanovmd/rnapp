import { IApiService } from "@api";
import { DialogDto } from "@api/api-gen/data-contracts";
import {
  assertNotNull,
  AsyncDataSource,
  disposer,
  InitializeDispose,
} from "@force-dev/utils";
import { makeAutoObservable } from "mobx";

import { IDialogDataStore } from "./DialogData.types";

@IDialogDataStore()
export class DialogDataStore implements IDialogDataStore {
  private _dialogId: string | null = null;
  private _dialogDataSource = new AsyncDataSource<DialogDto, string>(id =>
    this._apiService.getDialogById(id),
  );

  constructor(@IApiService() private _apiService: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize(dialogId: string) {
    this._dialogId = dialogId;

    const disposers = new Set<InitializeDispose>();

    return () => {
      disposer(Array.from(disposers));
      disposers.clear();
    };
  }

  get dialogId() {
    return assertNotNull(this._dialogId, "DialogDataStore non initialized");
  }

  get isLoading() {
    return this._dialogDataSource.isLoading;
  }

  get data() {
    return this._dialogDataSource.d;
  }

  async refresh(): Promise<void> {
    await this._dialogDataSource.refresh(this.dialogId);
  }
}
