import { IAuthStore } from "@entities/auth";
import { IUserStore } from "@entities/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IApiService } from "@shared/api";
import { useNotifications } from "@shared/lib/notifications";
import { useCallback, useEffect, useState } from "react";
import ReactNativeBiometrics from "react-native-biometrics";
import { getDeviceName, getUniqueId } from "react-native-device-info";

const biometrics = new ReactNativeBiometrics();

export const useBiometric = () => {
  const [support, setSupport] = useState<boolean>(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  const api = IApiService.useInstance();
  const authStore = IAuthStore.useInstance();
  const userStore = IUserStore.useInstance();
  const notifications = useNotifications();

  const available = !!registeredUserId && support;

  useEffect(() => {
    AsyncStorage.getItem("biometricUserId").then(setRegisteredUserId);

    biometrics.isSensorAvailable().then(async ({ available }) => {
      setSupport(available);
    });
  }, []);

  const onRemoveBiometric = useCallback(async () => {
    await biometrics.deleteKeys();
    await AsyncStorage.removeItem("biometricUserId");
    setRegisteredUserId(null);
    notifications.success("Биометрия успешно отключена.");
  }, [notifications]);

  const getBiometricPublicKey = useCallback(async () => {
    const { keysExist } = await biometrics.biometricKeysExist();

    if (keysExist && registeredUserId) {
      notifications.info("Биометрия уже подключена.");

      return null;
    } else {
      const { publicKey } = await biometrics.createKeys();

      return publicKey;
    }
  }, [registeredUserId, notifications]);

  const registration = useCallback(async () => {
    const userId = userStore.user?.id;

    if (!userId) {
      return false;
    }
    const deviceId = await getUniqueId();
    const deviceName = await getDeviceName();

    const publicKey = await getBiometricPublicKey();

    if (publicKey) {
      const response = await api.registerBiometric({
        deviceName,
        deviceId,
        publicKey,
      });

      if (response.error) {
        notifications.error(response.error.message);
      } else if (response.data) {
        if (response.data.registered) {
          notifications.success("Биометрия успешно подключена.");
          await AsyncStorage.setItem("biometricUserId", userId);
          setRegisteredUserId(userId);
        } else {
          notifications.warning("Не удалось подключить биометрию.");
          await biometrics.deleteKeys();
        }

        return response.data.registered;
      }
    }

    return false;
  }, [api, userStore.user?.id, getBiometricPublicKey, notifications]);

  const authorization = useCallback(async () => {
    if (!registeredUserId) {
      return;
    }

    const deviceId = await getUniqueId();

    const response = await api.generateNonce({ deviceId });

    if (response.error) {
      notifications.error(response.error.message);
    } else if (response.data) {
      const payload = response.data.nonce;

      const { success, signature, error } = await biometrics.createSignature({
        promptMessage: "Sign in",
        payload,
      });

      if (error) {
        notifications.error(error);
      } else if (success && signature) {
        const response = await api.verifySignature({
          deviceId,
          signature,
        });

        if (response.error) {
          await onRemoveBiometric();
          notifications.error(response.error.message);
        } else if (response.data?.verified) {
          await authStore.restore(response.data.tokens);
        }
      }
    }

    return false;
  }, [registeredUserId, api, onRemoveBiometric, notifications, authStore]);

  return {
    available,
    registration,
    authorization,
    support,
    onRemoveBiometric,
  };
};
