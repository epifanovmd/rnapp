import { createServiceDecorator } from "@di";
import { SupportInitialize } from "@utils";

export const IAppDataStore = createServiceDecorator<IAppDataStore>();

export type IAppDataStore = SupportInitialize;
