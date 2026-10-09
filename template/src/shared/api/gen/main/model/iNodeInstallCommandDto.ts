/**
 * Команда установки и одноразовый токен регистрации узла.
 */
export interface INodeInstallCommandDto {
  /** `curl … | sudo sh -s -- --token … --server …`. */
  command: string;
  /** Токен регистрации (одноразовый, с меткой узла) — только в этом ответе. */
  token: string;
  tokenId: string;
  expiresAt: string;
}
