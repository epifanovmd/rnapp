import { BiometricSignInButton } from "@features/biometric";
import { SignInForm } from "@features/sign-in";
import { useNavigation } from "@shared/lib/navigation";
import { AuthLayout } from "@widgets/auth-layout";
import React, { FC, useCallback } from "react";

/** Экран входа; после успеха guard-группы стека сами переключают навигатор. */
export const SignIn: FC = () => {
  const navigation = useNavigation();

  const handleForgotPassword = useCallback(
    () => navigation.navigate("RecoveryPassword"),
    [navigation],
  );
  const handleSignUp = useCallback(
    () => navigation.navigate("SignUp"),
    [navigation],
  );

  return (
    <AuthLayout>
      <SignInForm
        onForgotPassword={handleForgotPassword}
        onSignUp={handleSignUp}
        alternatives={<BiometricSignInButton />}
      />
    </AuthLayout>
  );
};
