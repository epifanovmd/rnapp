import { createApiMutator } from "../create-http-client";
import { IMainHttpClient } from "./main.types";

/** Мутатор orval для основного бэкенда (см. `orval.config.ts`). */
export const mainMutator = createApiMutator(IMainHttpClient);
