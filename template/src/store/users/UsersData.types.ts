import { iocDecorator, ListCollectionHolder } from "@force-dev/utils";

import { IUser } from "../../service";

export const IUsersDataStore = iocDecorator<IUsersDataStore>();

export interface IUsersDataStore {
  holder: ListCollectionHolder<IUser>;
  error?: string;
  loading: boolean;
  loaded: boolean;

  onRefresh(): Promise<IUser[]>;
}
