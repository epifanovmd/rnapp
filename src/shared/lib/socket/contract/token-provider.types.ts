import { createInjectDecorator } from "@shared/lib/di";

export interface ITokenProvider {
  readonly accessToken: string;

  /** Обновить, если токена нет или срок на исходе; вызывается перед каждым handshake. */
  ensureFreshToken(): Promise<void>;
  /** Обновить принудительно: сервер отказал в подключении или разорвал его. */
  refreshToken(): Promise<void>;
  onTokenChange(cb: (token: string) => void): () => void;
}

export const ITokenProvider =
  createInjectDecorator<ITokenProvider>("ITokenProvider");
