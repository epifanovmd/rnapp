import { iocDecorator } from "@force-dev/utils";

export const ITokenService = iocDecorator<ITokenService>();

export interface ITokenService {
  token: string;
  refreshToken: string;

  setTokens(accessToken: string, refreshToken: string): void;

  restoreRefreshToken(): Promise<string>;

  clear(): void;
}
