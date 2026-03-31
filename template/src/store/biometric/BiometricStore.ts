import { IApiService } from "@api";
import { IBiometricDeviceDto } from "@api/api-gen/data-contracts";
import { CollectionHolder } from "@store";
import { makeAutoObservable } from "mobx";

import { IBiometricStore } from "./BiometricStore.types";

@IBiometricStore({ inSingleton: true })
export class BiometricStore implements IBiometricStore {
  public devicesHolder = new CollectionHolder<IBiometricDeviceDto>({
    onFetch: async () => {
      const res = await this._api.getDevices();

      return { data: res.data?.devices, error: res.error };
    },
  });

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async loadDevices() {
    await this.devicesHolder.load();
  }

  async registerBiometric(data: {
    deviceId: string;
    deviceName: string;
    publicKey: string;
  }) {
    const res = await this._api.registerBiometric(data);

    if (res.data) {
      await this.loadDevices();
    }

    return res;
  }

  async generateNonce(deviceId: string) {
    return this._api.generateNonce({ deviceId });
  }

  async verifySignature(data: {
    deviceId: string;
    signature: string;
    nonce: string;
  }) {
    return this._api.verifySignature(data);
  }

  async deleteDevice(deviceId: string) {
    const res = await this._api.deleteDevice({ deviceId });

    if (!res.error) {
      this.devicesHolder.removeItem(d => d.deviceId === deviceId);
    }

    return res;
  }
}
