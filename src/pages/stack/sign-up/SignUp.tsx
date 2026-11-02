import { SignUpForm } from "@features/sign-up";
import { useNavigation } from "@shared/lib/navigation";
import { AuthLayout } from "@widgets/auth-layout";
import React, { FC, useCallback } from "react";

/** Экран регистрации; после успеха guard-группы стека сами переключают навигатор. */
export const SignUp: FC = () => {
  const navigation = useNavigation();

  const handleSignIn = useCallback(
    () => navigation.navigate("SignIn"),
    [navigation],
  );

  return (
    <AuthLayout>
      <SignUpForm onSignIn={handleSignIn} />
    </AuthLayout>
  );
};
