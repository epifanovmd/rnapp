import { createInjectDecorator } from "@shared/lib/di";
import { SupportInitialize } from "@shared/lib/utils";

export const IAppDataStore =
  createInjectDecorator<IAppDataStore>("IAppDataStore");

export type IAppDataStore = SupportInitialize;
