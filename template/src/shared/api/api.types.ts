import { createInjectDecorator } from "@shared/lib/di";

import type { getRestApi } from "./gen/api";

export type IApiService = ReturnType<typeof getRestApi>;
export const IApiService = createInjectDecorator<IApiService>();
