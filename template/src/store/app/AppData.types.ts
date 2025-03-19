import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";

import { IRefreshTokenResponse } from "~@service";

export const IAppDataStore = createServiceDecorator<IAppDataStore>();

export interface IAppDataStore extends SupportInitialize {
  restoreToken(): Promise<IRefreshTokenResponse>;
}
