import { IApiService } from "@api";
import { FcmTokenDto } from "@api/api-gen/data-contracts";
import { DataHolder, isString } from "@force-dev/utils";
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { INavigationService, log, NavigationService } from "@service";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import { Linking, Platform } from "react-native";

// import PushNotification from "react-native-push-notification";
import { IPushNotificationDataStore } from "./PushNotificationData.types";

@IPushNotificationDataStore({ inSingleton: true })
export class PushNotificationDataStore implements IPushNotificationDataStore {
  private _showInForeground?: boolean = true;
  private _deviceToken?: string = undefined;
  private _fcmToken?: string = undefined;
  private _holder: DataHolder<FcmTokenDto[]> = new DataHolder<FcmTokenDto[]>();

  constructor(
    @IApiService()
    private _apiService: IApiService,
    @INavigationService() private _navigationService: NavigationService,
  ) {
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

  get myPushNotificationToken() {
    return this._fcmToken;
  }

  get tokens() {
    return this._holder.d ?? [];
  }

  showInForeground(show?: boolean) {
    this._showInForeground = !!show;
  }

  async onGetPushNotificationTokens(userId: string) {
    this._holder.setLoading();

    const res = await this._apiService.getTokens({ userId });

    if (res.error) {
      this._holder.setError(res.error.message);
    } else if (res.data) {
      this._holder.setData(res.data);
    }
  }
}
