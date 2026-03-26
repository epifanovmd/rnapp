import { IApiService } from "@api";
import { DeviceTokenDto, EDevicePlatform } from "@api/api-gen/data-contracts";
import { log } from "@core";
import { makeAutoObservable, runInAction } from "mobx";
import { Platform } from "react-native";

import { IPushNotificationDataStore } from "./PushNotificationData.types";

@IPushNotificationDataStore({ inSingleton: true })
export class PushNotificationDataStore implements IPushNotificationDataStore {
  private _deviceToken?: string = undefined;

  constructor(@IApiService() private _apiService: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    log.debug("GoogleStore init");

    if (!this._deviceToken && !this._fcmToken) {
      // https://github.com/zo0r/react-native-push-notification/issues/1251#issuecomment-565373047
      const getToken = Platform.select<(token: string) => Promise<string>>({
        ios: async (token: string) =>
          await this._apiService
            .registerApn({
              apns_tokens: [token],
              sandbox: true,
              application: "ru.force-dev.rnapp",
            })
            .then(res => (res.data || [""])[0]),
        default: async (token: string) =>
          await new Promise(resolve => {
            resolve(token);
          }),
      });

      // PushNotification.configure({
      //   // (optional) Called when Token is generated (iOS and Android)
      //   onRegister: async ({ token }) => {
      //     console.log("token", token);
      //     const fcmToken = await getToken(token);
      //     // log.info(`Push Notification token: ${os} -`, fcmToken);
      //
      //     runInAction(() => {
      //       this._deviceToken = token;
      //       this._fcmToken = fcmToken;
      //     });
      //
      //     this._apiService.addToken({ token: fcmToken }).catch(err => {
      //       log.error("FCM Token SET ERROR - ", err.message);
      //     });
      //   },
      //
      //   // (required) Called when a remote is received or opened, or local notification is opened
      //   onNotification: notification => {
      //     const isClicked = notification.userInteraction;
      //     const foreground = notification.foreground;
      //
      //     if (isClicked) {
      //       const { link = null } = notification?.data || {};
      //
      //       link && Linking.openURL(link);
      //     } else if (
      //       foreground &&
      //       isString(notification.message) &&
      //       this._showInForeground
      //     ) {
      //       PushNotification.createChannel(
      //         {
      //           channelId: "local-android-channel",
      //           channelName: "local android channel",
      //         },
      //         () => {},
      //       );
      //       PushNotification.localNotification({
      //         message: notification.message,
      //         channelId: "local-android-channel",
      //         userInfo: {
      //           notificationType: "foreground",
      //         },
      //       });
      //     }
      //
      //     notification.finish(PushNotificationIOS.FetchResult.NewData);
      //   },
      //
      //   // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      //   onAction: notification => {
      //     log.debug("ACTION:", notification.action);
      //     log.debug("NOTIFICATION:", notification);
      //
      //     // process the action
      //   },
      //
      //   // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
      //   onRegistrationError: err => {
      //     console.error(err.message, err);
      //   },
      //
      //   // IOS ONLY (optional): default: all - Permissions to register.
      //   permissions: {
      //     alert: true,
      //     badge: true,
      //     sound: true,
      //   },
      //
      //   // Should the initial notification be popped automatically
      //   // default: true
      //   popInitialNotification: true,
      //
      //   /**
      //    * (optional) default: true
      //    * - Specified if permissions (ios) and token (android and ios) will requested or not,
      //    * - if not, you must call PushNotificationsHandler.requestPermissions() later
      //    * - if you are not using remote notification or do not have Firebase installed, use this:
      //    *     requestPermissions: Platform.OS === 'ios'
      //    */
      //   requestPermissions: true,
      // });
    }

    return [
      reaction(
        () => this._navigationService.currentScreenName,
        currentScreenName => {
          this.showInForeground(
            !(
              currentScreenName === "Dialogs" ||
              currentScreenName === "ChatScreen"
            ),
          );
        },
        { fireImmediately: true },
      ),
    ];
  }

  get myDeviceToken() {
    return this._deviceToken;
  }

  async registerDevice(
    token: string,
    platform?: string,
  ): Promise<DeviceTokenDto | undefined> {
    const devicePlatform =
      platform ??
      Platform.select({
        ios: EDevicePlatform.Ios,
        android: EDevicePlatform.Android,
        default: EDevicePlatform.Web,
      });

    const res = await this._apiService.registerDevice({
      token,
      platform: devicePlatform as EDevicePlatform,
    });

    if (res.data) {
      runInAction(() => {
        this._deviceToken = token;
      });

      return res.data;
    }

    return undefined;
  }

  async unregisterDevice(token: string): Promise<void> {
    await this._apiService.unregisterDevice({ token });

    runInAction(() => {
      this._deviceToken = undefined;
    });
  }
}
