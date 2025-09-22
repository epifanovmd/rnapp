import { AttachModalProvider, HoldItemProvider } from "@components";
import {
  initLocalization,
  ThemeProvider,
  useTheme,
  useTranslation,
} from "@core";
import { disposer } from "@force-dev/utils";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost, PortalProvider } from "@gorhom/portal";
import notifee from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { log, navigationRef } from "@service";
import { useAppDataStore } from "@store/app";
import { configure } from "mobx";
import { observer } from "mobx-react-lite";
import React, { FC, memo, PropsWithChildren, useEffect } from "react";
import { StatusBar, StyleSheet, useColorScheme } from "react-native";
import Config from "react-native-config";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppNavigator } from "./App.navigator";
import { AppNotifications } from "./App.notifications";

configure({ enforceActions: "observed" });

initLocalization({ initLang: "ru" });

export const App: FC = observer(() => {
  const isDarkMode = useColorScheme() === "dark";
  const { changeLanguage } = useTranslation();

  const { initialize } = useAppDataStore();

  useEffect(() => {
    notifee.requestPermission().then();

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

  return (
    <GestureHandlerRootView style={ss.container}>
      <ThemeProvider>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <SafeAreaProvider>
          <_HoldItemProvider>
            <BottomSheetModalProvider>
              <AttachModalProvider>
                <AppNotifications>
                  <PortalHost name={"modal"} />
                  <AppNavigator ref={navigationRef} />
                </AppNotifications>
              </AttachModalProvider>
            </BottomSheetModalProvider>
          </_HoldItemProvider>
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
