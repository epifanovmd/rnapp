import { DataHolder, iocDecorator } from "@force-dev/utils";

import { IProfile } from "../../service";

export const IProfileDataStore = iocDecorator<IProfileDataStore>();

export interface IProfileDataStore {
  holder: DataHolder<IProfile>;
  profile?: IProfile;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;

  getProfile(): Promise<IProfile | undefined>;
}
