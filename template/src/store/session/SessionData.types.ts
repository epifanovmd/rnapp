import { iocDecorator, SupportInitialize } from "@force-dev/utils";

import { IRefreshTokenResponse } from "~@service";

export const ISessionDataStore = iocDecorator<ISessionDataStore>();

export interface ISessionDataStore extends SupportInitialize {
  isAuthorized: boolean;
  isReady: boolean;

  restore(tokens?: IRefreshTokenResponse): Promise<string>;
}
