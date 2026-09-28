import { IAuthSessionGuard } from "@shared/lib/contracts";
import { ContainerModule } from "inversify";

import { AuthSessionGuard } from "./api/session-guard";
import { AuthStore } from "./model/store";
import { IAuthStore } from "./model/types";

/**
 * Доменный слой авторизации: статус, 2FA, guard. Токены и их обновление —
 * инфраструктура бэкенда (`IMainSession` в `shared/api/main`).
 */
export const authModule = new ContainerModule(({ bind }) => {
  bind(IAuthSessionGuard.Tid).to(AuthSessionGuard).inSingletonScope();
  bind(IAuthStore.Tid).to(AuthStore).inSingletonScope();
});
