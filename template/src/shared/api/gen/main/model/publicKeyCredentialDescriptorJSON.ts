import type { Base64URLString } from "./base64URLString";

export interface PublicKeyCredentialDescriptorJSON {
  id: Base64URLString;
  /** Всегда `public-key`; строкой — чтобы новые типы не ломали контракт. */
  type: string;
  /** Транспорты из `AuthenticatorTransportFuture` и будущие значения. */
  transports?: string[];
}
