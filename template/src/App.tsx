import {
  HoldItemProvider,
  NotificationProvider,
  NotificationToastProps,
} from "@force-dev/react-mobile";
import { disposer } from "@force-dev/utils";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { configure } from "mobx";
import { observer } from "mobx-react-lite";
import React, {
  FC,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import BootSplash from "react-native-bootsplash";
import Config from "react-native-config";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AttachModalProvider } from "~@components";
import { log } from "~@service";
import { useAppDataStore } from "~@store/app";
import { ThemeProvider, useTheme } from "~@theme";

import { AppNavigator } from "./AppNavigator";
import { initLocalization, useTranslation } from "./localization";
import { navigationRef } from "./navigation";
configure({ enforceActions: "observed" });

initLocalization({ initLang: "ru" });

const App: FC = observer(() => {
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

    setTimeout(() => {
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
                <_Notifications>
                  <AppNavigator ref={navigationRef} onReady={onReady} />
                </_Notifications>
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
  notificationProvider: {
    maxWidth: "100%",
    width: "100%",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  customToast: {
    maxWidth: "100%",
    paddingHorizontal: 60,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderLeftColor: "#00C851",
    borderLeftWidth: 6,
    justifyContent: "center",
    paddingLeft: 16,
  },
  customToastTitle: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  customToastText: { color: "#a3a3a3", marginTop: 2 },
});

const _Notifications: FC<PropsWithChildren> = ({ children }) => {
  const { top } = useSafeAreaInsets();
  const renderType = useMemo(
    () => ({
      custom_toast: (toast: NotificationToastProps) => (
        <View style={[ss.customToast, { marginTop: top }]}>
          <Text style={ss.customToastTitle}>{toast.data?.title}</Text>
          <Text style={ss.customToastText}>{toast.message}</Text>
        </View>
      ),
    }),
    [top],
  );

  return (
    <NotificationProvider
      style={ss.notificationProvider}
      // onPress={() => {
      //   console.log('press');
      // }}
      // onClose={() => {
      //   console.log('onClose');
      // }}
      renderType={renderType}
    >
      {children}
    </NotificationProvider>
  );
};

const _HoldItemProvider: FC<PropsWithChildren> = memo(({ children }) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <HoldItemProvider safeAreaInsets={insets} theme={isDark ? "dark" : "light"}>
      {children}
    </HoldItemProvider>
  );
});

export default App;
