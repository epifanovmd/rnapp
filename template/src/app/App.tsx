import { AttachModalProvider } from "@components";
import { HoldItemProvider } from "@force-dev/react-mobile";
import { disposer } from "@force-dev/utils";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { log } from "@service";
import { useAppDataStore } from "@store/app";
import { ThemeProvider, useTheme } from "@theme";
import { configure } from "mobx";
import { observer } from "mobx-react-lite";
import React, {
  FC,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
} from "react";
import { StatusBar, StyleSheet, useColorScheme } from "react-native";
import ReactNativeBiometrics, { BiometryTypes } from "react-native-biometrics";
import BootSplash from "react-native-bootsplash";
import Config from "react-native-config";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { initLocalization, useTranslation } from "../localization";
import { navigationRef } from "../navigation";
import { AppNavigator } from "./App.navigator";
import { AppNotifications } from "./App.notifications";

configure({ enforceActions: "observed" });

initLocalization({ initLang: "ru" });

export const App: FC = observer(() => {
  const isDarkMode = useColorScheme() === "dark";
  const { changeLanguage } = useTranslation();

  const { initialize, sessionDataStore } = useAppDataStore();

  useEffect(() => {
    const dispose = initialize();

    AsyncStorage.getItem("i18nextLng").then(async lang => {
      if (lang) {
        await changeLanguage(lang);
      }
    });

    log.debug("CONFIG", JSON.stringify(Config));

    return () => {
      disposer(dispose);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReady = useCallback(async () => {
    await sessionDataStore.restore().then();

    const rnBiometrics = new ReactNativeBiometrics();
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    if (available && biometryType === BiometryTypes.FaceID) {
      // const { success, signature, error } = await rnBiometrics.createSignature({
      //   promptMessage: "Sign in",
      //   payload,
      // });
      //
      // console.log("success", success);
      // console.log("error", error);
      // console.log("signature", signature);
      // const { success, error } = await rnBiometrics.simplePrompt({
      //   promptMessage: "123",
      // });
      //
      // console.log("success", success);
      // console.log("error", error);
      //
      // if (success) {
      //   BootSplash.hide({ fade: true });
      // }
    }

    setTimeout(() => {
      trigger(HapticFeedbackTypes.impactLight);
      BootSplash.hide({ fade: true });
    }, 500);
  }, [sessionDataStore]);

  return (
    <GestureHandlerRootView style={ss.container}>
      <ThemeProvider>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <_HoldItemProvider>
              <AttachModalProvider>
                <AppNotifications>
                  <AppNavigator ref={navigationRef} onReady={onReady} />
                </AppNotifications>
              </AttachModalProvider>
            </_HoldItemProvider>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
});

const ss = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const _HoldItemProvider: FC<PropsWithChildren> = memo(({ children }) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <HoldItemProvider safeAreaInsets={insets} theme={isDark ? "dark" : "light"}>
      {children}
    </HoldItemProvider>
  );
});
