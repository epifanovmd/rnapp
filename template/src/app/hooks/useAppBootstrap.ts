import { IAuthStore } from "@entities/auth";
import { IBiometricStore } from "@features/biometric";
import { AppSplash } from "@shared/lib/splash";
import { useCallback } from "react";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";

const SPLASH_HIDE_DELAY = 500;

/**
 * Бутстрап по готовности навигации: restore-сессии, скрытие splash и, если
 * сессии нет, а на устройстве включён вход по биометрии, — его автозапрос.
 */
export const useAppBootstrap = () => {
  const authStore = IAuthStore.useInstance();
  const biometricStore = IBiometricStore.useInstance();

  return useCallback(async () => {
    await Promise.all([authStore.restore(), biometricStore.load()]);

    setTimeout(() => {
      trigger(HapticFeedbackTypes.impactLight);
      AppSplash.hide({ fade: true });

      if (!authStore.isAuthenticated) biometricStore.signIn({ auto: true });
    }, SPLASH_HIDE_DELAY);
  }, [authStore, biometricStore]);
};
