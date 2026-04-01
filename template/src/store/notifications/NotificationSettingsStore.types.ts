import {
  DeviceTokenDto,
  EDevicePlatform,
  IRegisterDeviceBody,
  NotificationSettingsDto,
} from "@api/api-gen/data-contracts";
import { createServiceDecorator } from "@di";
import { EntityHolder, MutationHolder } from "@store/holders";

export const INotificationSettingsStore =
  createServiceDecorator<INotificationSettingsStore>();

export interface INotificationSettingsStore {
  settingsHolder: EntityHolder<NotificationSettingsDto>;
  registerMutation: MutationHolder<IRegisterDeviceBody, DeviceTokenDto>;

  settings: NotificationSettingsDto | null;
  isLoading: boolean;

  load(): Promise<void>;
  update(data: Partial<NotificationSettingsDto>): Promise<void>;
  registerDevice(token: string, platform: EDevicePlatform): Promise<void>;
  unregisterDevice(token: string): Promise<void>;

  handleSettingsChanged(settings: NotificationSettingsDto): void;
}
