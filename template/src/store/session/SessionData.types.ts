import { iocDecorator, SupportInitialize } from "@force-dev/utils";

import { IProfile } from "../../service";

export const ISessionDataStore = iocDecorator<ISessionDataStore>();

export interface ISessionDataStore extends SupportInitialize {
  restore(): Promise<IProfile | undefined>;
}
