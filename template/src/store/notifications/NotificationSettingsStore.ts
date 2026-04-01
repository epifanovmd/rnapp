import { IApiService } from "@api";
import {
  DeviceTokenDto,
  EDevicePlatform,
  IRegisterDeviceBody,
  NotificationSettingsDto,
} from "@api/api-gen/data-contracts";
import { EntityHolder, MutationHolder } from "@store/holders";
import { makeAutoObservable } from "mobx";

import { INotificationSettingsStore } from "./NotificationSettingsStore.types";

@INotificationSettingsStore({ inSingleton: true })
export class NotificationSettingsStore implements INotificationSettingsStore {
  public settingsHolder = new EntityHolder<NotificationSettingsDto>();
  public registerMutation = new MutationHolder<
    IRegisterDeviceBody,
    DeviceTokenDto
  >();

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get settings() {
    return this.settingsHolder.data;
  }

  get isLoading() {
    return this.settingsHolder.isLoading;
  }

  async load() {
    await this.settingsHolder.fromApi(() => this._api.getSettings());
  }

  async update(data: Partial<NotificationSettingsDto>) {
    const res = await this._api.updateSettings(data);

    if (res.data) {
      this.settingsHolder.setData(res.data);
    }
  }

  async registerDevice(token: string, platform: EDevicePlatform) {
    await this.registerMutation.execute({ token, platform }, async args => {
      return this._api.registerDevice(args);
    });
  }

  async unregisterDevice(token: string) {
    await this._api.unregisterDevice({ token });
  }

  handleSettingsChanged(settings: NotificationSettingsDto) {
    this.settingsHolder.setData(settings);
  }
}
