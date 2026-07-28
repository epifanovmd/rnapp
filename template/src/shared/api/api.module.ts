import { ContainerModule } from "inversify";

import { api } from "./api";
import { IApiService } from "./api.types";
import { HttpClient, IHttpClient } from "./http-client";

export const apiModule = new ContainerModule(({ bind }) => {
  bind(IApiService.Tid).toConstantValue(api);
  bind(IHttpClient.Tid).to(HttpClient).inSingletonScope();
});
