import { createInjectDecorator } from "@shared/lib/di";

export interface ITokenSource {
  readonly accessToken: string;

  ensureFreshToken(): Promise<void>;
  refreshToken(): Promise<void>;
}

export const ITokenSource = createInjectDecorator<ITokenSource>("ITokenSource");
