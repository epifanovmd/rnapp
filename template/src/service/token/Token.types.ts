import { createServiceDecorator } from "@force-dev/utils";

export const ITokenService = createServiceDecorator<ITokenService>();

export interface ITokenService {
  accessToken: string | null;
  refreshToken: string | null;

  setTokens(accessToken: string, refreshToken: string): void;
  restoreRefreshToken(): Promise<string | null>;
  clear(): void;
}
