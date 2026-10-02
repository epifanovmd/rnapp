import { RecoveryPasswordForm } from "@features/recovery-password";
import { useNavigation } from "@shared/lib/navigation";
import { AuthLayout } from "@widgets/auth-layout";
import React, { FC, useCallback } from "react";

/** Экран запроса ссылки для сброса пароля. */
export const RecoveryPassword: FC = () => {
  const navigation = useNavigation();

  const handleBack = useCallback(
    () => navigation.navigate("SignIn"),
    [navigation],
  );

  return (
    <AuthLayout>
      <RecoveryPasswordForm onBack={handleBack} />
    </AuthLayout>
  );
};
