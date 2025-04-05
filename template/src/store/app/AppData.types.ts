import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";
import { ISessionDataStore } from "@store";

export const IAppDataStore = createServiceDecorator<IAppDataStore>();

export interface IAppDataStore extends SupportInitialize {
  sessionDataStore: ISessionDataStore;
}
