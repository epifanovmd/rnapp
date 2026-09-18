import { isJwtExpired } from "./jwt";
import type { RefreshPolicy } from "./session.types";

/** Заранее не обновлять, реагировать на 401. Для токенов без известного срока. */
export const refreshNever: RefreshPolicy = () => false;

/** Обновлять, когда до истечения JWT осталось меньше буфера. */
export const refreshBeforeJwtExpiry =
  (bufferSeconds = 60): RefreshPolicy =>
  tokens =>
    isJwtExpired(tokens.accessToken, bufferSeconds);

/** Обновлять перед каждым запросом. Для очень коротких токенов. */
export const refreshAlways: RefreshPolicy = () => true;
