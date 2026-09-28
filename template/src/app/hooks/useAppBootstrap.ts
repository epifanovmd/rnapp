import { IAuthStore } from "@entities/auth";
import { useBiometric } from "@features/biometric";
import { AppSplash } from "@shared/lib/splash";
import { useCallback } from "react";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";

/** Бутстрап по готовности навигации: restore-сессия, биометрия, скрытие splash. */
export const useAppBootstrap = () => {
  const authStore = IAuthStore.useInstance();
  const { available, authorization } = useBiometric();

  return useCallback(async () => {
    await authStore.restore();

    if (available && !authStore.isAuthenticated) {
      await authorization();
    }

    setTimeout(() => {
      trigger(HapticFeedbackTypes.impactLight);
      AppSplash.hide({ fade: true });
    }, 500);
  }, [authorization, available, authStore]);
};
