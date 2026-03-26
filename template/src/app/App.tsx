import { Dialog, HoldItemProvider } from "@components";
import { ThemeProvider, useTheme } from "@core";
import { disposer } from "@di";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { navigationRef } from "@navigation";
import { useAppDataStore } from "@store/app";
import { setDefaultOptions } from "date-fns";
import { ru } from "date-fns/locale";
import { configure } from "mobx";
import { observer } from "mobx-react-lite";
import React, { FC, memo, PropsWithChildren, useEffect } from "react";
import { StyleSheet } from "react-native";
import Config from "react-native-config";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppNavigator } from "./App.navigator";
import { AppNotifications } from "./App.notifications";

configure({ enforceActions: "observed" });
setDefaultOptions({ locale: ru });

export const App: FC = observer(() => {
  const { initialize } = useAppDataStore();

  useEffect(() => {
    const dispose = initialize();

    console.log("CONFIG", JSON.stringify(Config));

    return () => {
      disposer(dispose);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GestureHandlerRootView style={ss.container}>
      <ThemeProvider>
        <SafeAreaProvider>
          <_HoldItemProvider>
            <BottomSheetModalProvider>
              <AppNotifications>
                <Dialog.Host />
                <KeyboardProvider>
                  <AppNavigator ref={navigationRef} />
                </KeyboardProvider>
              </AppNotifications>
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
