import { IAgentsStore } from "@entities/agent";
import { IAuditRealtime, IAuditStore } from "@entities/audit";
import { IAuthStore } from "@entities/auth";
import { IFileRealtime, IFileStore } from "@entities/file";
import { IJobRealtime, IJobStore } from "@entities/job";
import { INodesStore } from "@entities/node";
import { IUserRealtime, IUserStore } from "@entities/user";
import { ISocketTransport } from "@shared/lib/socket";
import { disposer, InitializeDispose } from "@shared/lib/utils";
import { injectable } from "inversify";
import { makeAutoObservable, reaction } from "mobx";

import { IAppDataStore } from "./app-data-types";

@injectable()
export class AppDataStore implements IAppDataStore {
  constructor(
    @IAuthStore() private _authStore: IAuthStore,
    @ISocketTransport() private _socketTransport: ISocketTransport,
    @IUserStore() private _userStore: IUserStore,
    @IUserRealtime() private _userRealtime: IUserRealtime,
    @IFileStore() private _fileStore: IFileStore,
    @IFileRealtime() private _fileRealtime: IFileRealtime,
    @IJobStore() private _jobStore: IJobStore,
    @IJobRealtime() private _jobRealtime: IJobRealtime,
    @IAuditStore() private _auditStore: IAuditStore,
    @IAuditRealtime() private _auditRealtime: IAuditRealtime,
    @IAgentsStore() private _agentsStore: IAgentsStore,
    @INodesStore() private _nodesStore: INodesStore,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    const socketDisposers = new Set<InitializeDispose>();

    return [
      reaction(
        () => this._authStore.isAuthenticated,
        isAuthenticated => {
          if (isAuthenticated) {
            this._userStore.load();
            socketDisposers.add(this._socketTransport.initialize());
            socketDisposers.add(this._userRealtime.initialize());
            socketDisposers.add(this._fileRealtime.initialize());
            socketDisposers.add(this._jobRealtime.initialize());
            socketDisposers.add(this._auditRealtime.initialize());
          } else {
            disposer(Array.from(socketDisposers));
            socketDisposers.clear();
            // Данные прежнего пользователя (права, профиль) не должны пережить
            // выход: следующий вход — возможно, другой человек.
            this._userStore.reset();
            this._fileStore.reset();
            this._jobStore.reset();
            this._auditStore.reset();
            this._agentsStore.reset();
            this._nodesStore.reset();
          }
        },
      ),
      () => {
        disposer(Array.from(socketDisposers));
        socketDisposers.clear();
      },
    ];
  }
}
