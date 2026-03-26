import { createServiceDecorator, SupportInitialize } from "@di";

import { IAuthStore } from "../auth";

export const IAppDataStore = createServiceDecorator<IAppDataStore>();

export interface IAppDataStore extends SupportInitialize {
  authStore: IAuthStore;
}
