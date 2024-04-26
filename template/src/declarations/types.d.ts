declare module 'react-native-config' {
  export interface NativeConfig {
    BASE_URL: string;
    APP_ID_IOS: string;
    APP_ID_ANDROID: string;
    DISPLAY_NAME: string;
    DEEPLINK_BASE_URL: string;
  }
  export const Config: NativeConfig;
  export default Config;
}
