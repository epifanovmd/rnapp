import { IApiService } from "@api";
import {
  IVerifyAuthenticationRequestDto,
  IVerifyRegistrationRequestDto,
} from "@api/api-gen/data-contracts";
import { makeAutoObservable } from "mobx";

import { IPasskeyStore } from "./PasskeyStore.types";

@IPasskeyStore({ inSingleton: true })
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
