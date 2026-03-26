import { useApi } from "@api";
import { useNotification } from "@core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@store";
import { useCallback, useEffect, useState } from "react";
import ReactNativeBiometrics from "react-native-biometrics";
import { getDeviceName, getUniqueId } from "react-native-device-info";

const biometrics = new ReactNativeBiometrics();

export const useBiometric = () => {
  const [support, setSupport] = useState<boolean>(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  const api = useApi();
  const authStore = useAuthStore();
  const { show } = useNotification();

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
    show("Биометрия успешно отключена.", { type: "success" });
  }, [show]);

  const getBiometricPublicKey = useCallback(async () => {
    const { keysExist } = await biometrics.biometricKeysExist();

    if (keysExist && registeredUserId) {
      show("Биометрия уже подключена.", { type: "normal" });

      return null;
    } else {
      const { publicKey } = await biometrics.createKeys();

      return publicKey;
    }
  }, [registeredUserId, show]);

  const registration = useCallback(async () => {
    const userId = authStore.user?.id;

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
        show(response.error.message, { type: "danger" });
      } else if (response.data) {
        if (response.data.registered) {
          show("Биометрия успешно подключена.", { type: "success" });
          await AsyncStorage.setItem("biometricUserId", userId);
          setRegisteredUserId(userId);
        } else {
          show("Не удалось подключить биометрию.", { type: "normal" });
          await biometrics.deleteKeys();
        }

        return response.data.registered;
      }
    }

    return false;
  }, [api, authStore.user?.id, getBiometricPublicKey, show]);

  const authorization = useCallback(async () => {
    if (!registeredUserId) {
      return;
    }

    const deviceId = await getUniqueId();

    const response = await api.generateNonce({ deviceId });

    if (response.error) {
      show(response.error.message, { type: "danger" });
    } else if (response.data) {
      const payload = response.data.nonce;

      const { success, signature, error } = await biometrics.createSignature({
        promptMessage: "Sign in",
        payload,
      });

      if (error) {
        show(error, { type: "danger" });
      } else if (success && signature) {
        const response = await api.verifySignature({
          deviceId,
          signature,
        });

        if (response.error) {
          await onRemoveBiometric();
          show(response.error.message, { type: "danger" });
        } else if (response.data?.verified) {
          await authStore.restore(response.data.tokens);
        }
      }
    }

    return false;
  }, [registeredUserId, api, onRemoveBiometric, show, authStore]);

  return {
    available,
    registration,
    authorization,
    support,
    onRemoveBiometric,
  };
};
