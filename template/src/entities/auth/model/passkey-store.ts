import { IApiService } from "@shared/api";
import {
  IVerifyAuthenticationRequestDto,
  IVerifyRegistrationRequestDto,
} from "@shared/api/gen/model";
import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import { IPasskeyStore } from "./passkey-types";

@injectable()
export class PasskeyStore implements IPasskeyStore {
  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async generateRegistrationOptions() {
    return this._api.generateRegistrationOptions();
  }

  async verifyRegistration(data: IVerifyRegistrationRequestDto) {
    return this._api.verifyRegistration(data);
  }

  async generateAuthenticationOptions(email?: string) {
    return this._api.generateAuthenticationOptions({ login: email ?? "" });
  }

  async verifyAuthentication(data: IVerifyAuthenticationRequestDto) {
    return this._api.verifyAuthentication(data);
  }
}
