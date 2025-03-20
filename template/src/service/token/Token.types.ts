import { iocDecorator } from "@force-dev/utils";

export const ITokenService = iocDecorator<ITokenService>();

export interface ITokenService {
  accessToken: string | null;
  refreshToken: string | null;

  setTokens(accessToken: string, refreshToken: string): void;
  restoreRefreshToken(): Promise<string | null>;
  clear(): void;
}
