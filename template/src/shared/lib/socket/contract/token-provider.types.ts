import { createInjectDecorator } from "@shared/lib/di";

export interface ITokenProvider {
  readonly accessToken: string;

  refreshToken(): Promise<void>;
  restoreSession(): Promise<boolean>;
  onTokenChange(cb: (token: string) => void): () => void;
}

export const ITokenProvider =
  createInjectDecorator<ITokenProvider>("ITokenProvider");
