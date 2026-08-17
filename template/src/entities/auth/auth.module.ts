import { ITokenSource } from "@shared/api";
import { IAuthSessionGuard } from "@shared/lib/contracts";
import { ITokenProvider } from "@shared/lib/socket/contract";
import { ContainerModule } from "inversify";

import { AuthJwtService } from "./api/jwt-service";
import { IAuthJwtService } from "./api/jwt-types";
import { AuthSessionGuard } from "./api/session-guard";
import { AuthSessionService } from "./api/session-service";
import { AuthTokenProvider } from "./api/token-provider";
import { AuthTokenSource } from "./api/token-source";
import { AuthTokenStorage } from "./api/token-storage";
import { IAuthSessionService, IAuthTokenStorage } from "./api/types";
import { AuthStore } from "./model/store";
import { IAuthStore } from "./model/types";

export const authModule = new ContainerModule(({ bind }) => {
  bind(IAuthTokenStorage.Tid).to(AuthTokenStorage).inSingletonScope();
  bind(IAuthSessionService.Tid).to(AuthSessionService).inSingletonScope();
  bind(IAuthJwtService.Tid).to(AuthJwtService).inSingletonScope();
  bind(IAuthSessionGuard.Tid).to(AuthSessionGuard).inSingletonScope();
  bind(ITokenProvider.Tid).to(AuthTokenProvider).inSingletonScope();
  bind(ITokenSource.Tid).to(AuthTokenSource).inSingletonScope();
  bind(IAuthStore.Tid).to(AuthStore).inSingletonScope();
});
