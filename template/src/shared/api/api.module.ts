// Контракт, а не бочка: бочка уведомлений тянет ещё и UI-компоненты.
import type { IInjectDecorator } from "@shared/lib/di";
import { INotificationService } from "@shared/lib/notifications/notification.types";
import type { ITokenSession } from "@shared/lib/session";
import { ITokenProvider } from "@shared/lib/socket/contract";
import { IStorageService } from "@shared/lib/storage";
import { ContainerModule, ResolutionContext } from "inversify";

import type { ApiClientDeps } from "./api.types";
import {
  createDummyJsonApi,
  createDummyJsonAuthApi,
  createDummyJsonHttpClient,
  createDummyJsonSession,
  IDummyJsonApi,
  IDummyJsonAuthApi,
  IDummyJsonHttpClient,
  IDummyJsonSession,
} from "./dummyjson";
import { getRestApi } from "./gen/main/api";
import {
  createMainAuthApi,
  createMainHttpClient,
  createMainSession,
  IMainApi,
  IMainAuthApi,
  IMainHttpClient,
  IMainSession,
} from "./main";

/** Зависимости фабрики клиента: сессия своя, уведомления общие. */
const clientDeps = (
  ctx: ResolutionContext,
  session: IInjectDecorator<ITokenSession>,
): ApiClientDeps => ({
  session: ctx.get<ITokenSession>(session.Tid),
  notifications: ctx.get<INotificationService>(INotificationService.Tid),
});

/** Каждый бэкенд регистрируется четвёркой: auth-API → сессия → клиент → API. */
export const apiModule = new ContainerModule(({ bind }) => {
  bind(IMainAuthApi.Tid).toDynamicValue(createMainAuthApi).inSingletonScope();
  bind(IMainSession.Tid)
    .toDynamicValue(ctx =>
      createMainSession(
        ctx.get(IMainAuthApi.Tid),
        ctx.get(IStorageService.Tid),
      ),
    )
    .inSingletonScope();
  bind(IMainHttpClient.Tid)
    .toDynamicValue(ctx => createMainHttpClient(clientDeps(ctx, IMainSession)))
    .inSingletonScope();
  bind(IMainApi.Tid).toDynamicValue(getRestApi).inSingletonScope();

  bind(IDummyJsonAuthApi.Tid)
    .toDynamicValue(createDummyJsonAuthApi)
    .inSingletonScope();
  bind(IDummyJsonSession.Tid)
    .toDynamicValue(ctx =>
      createDummyJsonSession(ctx.get(IDummyJsonAuthApi.Tid)),
    )
    .inSingletonScope();
  bind(IDummyJsonHttpClient.Tid)
    .toDynamicValue(ctx =>
      createDummyJsonHttpClient(clientDeps(ctx, IDummyJsonSession)),
    )
    .inSingletonScope();
  bind(IDummyJsonApi.Tid)
    .toDynamicValue(ctx =>
      createDummyJsonApi(ctx.get(IDummyJsonHttpClient.Tid)),
    )
    .inSingletonScope();

  // Сокет берёт токен из той же сессии, что и HTTP основного бэкенда.
  bind(ITokenProvider.Tid).toService(IMainSession.Tid);
});
