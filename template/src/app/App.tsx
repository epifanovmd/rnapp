import {
  AttachModalProvider,
  HoldItemProvider,
  TransitionProvider,
} from "@components";
import { disposer } from "@force-dev/utils";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { navigationRef } from "@navigation";
import notifee from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { log } from "@service";
import { useAppDataStore } from "@store/app";
import { ThemeProvider, useTheme } from "@theme";
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

import { initLocalization, useTranslation } from "../localization";
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
      <TransitionProvider>
        <ThemeProvider>
          <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <_HoldItemProvider>
                <AttachModalProvider>
                  <AppNotifications>
                    <AppNavigator ref={navigationRef} />
                  </AppNotifications>
                </AttachModalProvider>
              </_HoldItemProvider>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </TransitionProvider>
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
