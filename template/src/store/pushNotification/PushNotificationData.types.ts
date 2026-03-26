import { DeviceTokenDto } from "@api/api-gen/data-contracts";
import { iocHook } from "@common/ioc";
import { createServiceDecorator, SupportInitialize } from "@common/ioc";

export interface IPushNotificationDataStore extends SupportInitialize {
  myDeviceToken?: string;

  registerDevice(
    token: string,
    platform: string,
  ): Promise<DeviceTokenDto | undefined>;
  unregisterDevice(token: string): Promise<void>;
}

export const IPushNotificationDataStore =
  createServiceDecorator<IPushNotificationDataStore>();
export const usePushNotificationDataStore = iocHook(IPushNotificationDataStore);
