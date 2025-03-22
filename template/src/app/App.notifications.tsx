import {
  NotificationProvider,
  NotificationToastProps,
} from "@force-dev/react-mobile";
import React, { FC, PropsWithChildren, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const AppNotifications: FC<PropsWithChildren> = ({ children }) => {
  const { top } = useSafeAreaInsets();
  const renderType = useMemo(
    () => ({
      custom_toast: (toast: NotificationToastProps) => (
        <View style={[styles.customToast, { marginTop: top }]}>
          <Text style={styles.customToastTitle}>{toast.data?.title}</Text>
          <Text style={styles.customToastText}>{toast.message}</Text>
        </View>
      ),
    }),
    [top],
  );

  return (
    <NotificationProvider
      style={styles.notificationProvider}
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

const styles = StyleSheet.create({
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
