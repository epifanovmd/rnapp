import { DataHolder, iocDecorator } from "@force-dev/utils";

import { IProfile, ISignInRequest } from "../../service";

export const IProfileDataStore = iocDecorator<IProfileDataStore>();

export interface IProfileDataStore {
  holder: DataHolder<IProfile>;
  profile?: IProfile;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;

  restoreRefreshToken(): Promise<string>;

  getProfile(): Promise<void>;

  refresh(refreshToken: string): Promise<void>;

  signIn(params: ISignInRequest): Promise<void>;

  // signUp(params: ISignUpRequest): void;
}
