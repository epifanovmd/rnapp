import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { navigationRef } from "@shared/lib/navigation";
import { ThemeProvider, useTheme } from "@shared/lib/theme";
import { disposer } from "@shared/lib/utils";
import { Dialog, HoldItemProvider } from "@shared/ui";
import { setDefaultOptions } from "date-fns";
import { ru } from "date-fns/locale";
import { configure } from "mobx";
import { observer } from "mobx-react-lite";
import React, { FC, memo, PropsWithChildren, useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { registerContainerModules } from "./app.module";
import { AppNavigator } from "./App.navigator";
import { AppNotifications } from "./App.notifications";
import { IAppDataStore } from "./app-data-types";

registerContainerModules();
configure({ enforceActions: "observed" });
setDefaultOptions({ locale: ru });

export const App: FC = observer(() => {
  const { initialize } = IAppDataStore.useInstance();

  useEffect(() => {
    const dispose = initialize();

    return () => {
      disposer(dispose);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GestureHandlerRootView style={ss.container}>
      <ThemeProvider>
        <SafeAreaProvider>
          <HoldItemProviderImpl>
            <BottomSheetModalProvider>
              <AppNotifications>
                <Dialog.Host />
                <KeyboardProvider>
                  <AppNavigator ref={navigationRef} />
                </KeyboardProvider>
              </AppNotifications>
            </BottomSheetModalProvider>
          </HoldItemProviderImpl>
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

const HoldItemProviderImpl: FC<PropsWithChildren> = memo(({ children }) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <HoldItemProvider safeAreaInsets={insets} theme={isDark ? "dark" : "light"}>
      {children}
    </HoldItemProvider>
  );
});
