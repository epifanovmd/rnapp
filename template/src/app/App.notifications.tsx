import {
  NotificationProvider,
  NotificationToastProps,
} from "@shared/lib/notifications";
import { makeThemeStyles } from "@shared/lib/theme";
import React, { FC, PropsWithChildren, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const useThemeStyles = makeThemeStyles(({ colors }) => ({
  customToast: {
    backgroundColor: colors.surface,
    borderLeftColor: colors.success,
  },
  customToastTitle: {
    color: colors.textPrimary,
  },
  customToastText: {
    color: colors.textSecondary,
  },
}));

export const AppNotifications: FC<PropsWithChildren> = ({ children }) => {
  const { top } = useSafeAreaInsets();
  const ts = useThemeStyles();

  const renderType = useMemo(
    () => ({
      custom_toast: (toast: NotificationToastProps) => (
        <View style={[styles.customToast, ts.customToast, { marginTop: top }]}>
          <Text style={[styles.customToastTitle, ts.customToastTitle]}>
            {toast.data?.title}
          </Text>
          <Text style={[styles.customToastText, ts.customToastText]}>
            {toast.message}
          </Text>
        </View>
      ),
    }),
    [top, ts],
  );

  return (
    <NotificationProvider style={styles.toast} renderType={renderType}>
      {children}
    </NotificationProvider>
  );
};

const styles = StyleSheet.create({
  toast: {
    minHeight: 60,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  customToast: {
    marginHorizontal: 10,
    paddingHorizontal: 60,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 6,
    justifyContent: "center",
    paddingLeft: 16,
  },
  customToastTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  customToastText: {
    marginTop: 2,
  },
});
