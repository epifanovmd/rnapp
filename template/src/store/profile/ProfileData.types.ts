import { createServiceDecorator, DataHolder } from "@force-dev/utils";

import { IProfile } from "../../service";

export const IProfileDataStore = createServiceDecorator<IProfileDataStore>();

export interface IProfileDataStore {
  holder: DataHolder<IProfile>;
  profile?: IProfile;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;

  getProfile(): Promise<IProfile | undefined>;
}
