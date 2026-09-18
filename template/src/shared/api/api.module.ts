import { INotificationService } from "@shared/lib/notifications";
import { ContainerModule } from "inversify";

import { ITokenSource } from "./contract";
import { getRestApi } from "./gen/main/api";
import { createMainHttpClient, IMainApi, IMainHttpClient } from "./main";

/**
 * Регистрация HTTP-клиентов и API. Новый бэкенд = ещё одна пара
 * `bind(IXxxHttpClient)` + `bind(IXxxApi)`; ручные API — наследники `BaseApi`.
 */
export const apiModule = new ContainerModule(({ bind }) => {
  bind(IMainHttpClient.Tid)
    .toDynamicValue(ctx =>
      createMainHttpClient({
        tokenSource: ctx.get(ITokenSource.Tid),
        notifications: ctx.get(INotificationService.Tid),
      }),
    )
    .inSingletonScope();

  bind(IMainApi.Tid).toConstantValue(getRestApi());
});
