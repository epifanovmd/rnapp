import { FcmTokenDto } from "@api/api-gen/data-contracts";
import { iocHook } from "@force-dev/react";
import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";

export interface IPushNotificationDataStore extends SupportInitialize {
  myDeviceToken?: string;
  myPushNotificationToken?: string;
  tokens: FcmTokenDto[];

  showInForeground(show?: boolean): void;
  onGetPushNotificationTokens(userId: string): Promise<void>;
}

export const IPushNotificationDataStore =
  createServiceDecorator<IPushNotificationDataStore>();
export const usePushNotificationDataStore = iocHook(IPushNotificationDataStore);
