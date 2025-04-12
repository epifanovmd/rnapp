import { isEmail, isPhone } from "@common";
import { useNotification } from "@force-dev/react-mobile";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSessionDataStore } from "@store";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { useNavigation } from "../../../../navigation";
import { signUpFormValidationSchema, TSignUpForm } from "../validations";

export const useSignUpVM = () => {
  const sessionDataStore = useSessionDataStore();
  const navigation = useNavigation();
  const { show } = useNotification();

  const form = useForm<TSignUpForm>({
    defaultValues: {},
    resolver: zodResolver(signUpFormValidationSchema),
  });

  const handleSignUp = useCallback(async () => {
    return form.handleSubmit(async data => {
      const email = isEmail(data.login) ? data.login : undefined;
      const phone = isPhone(data.login) ? data.login : undefined;

      if (email) {
        await sessionDataStore.signUp({
          email,
          password: data.password,
        });
      } else if (phone) {
        await sessionDataStore.signUp({
          phone,
          password: data.password,
        });
      }

      if (sessionDataStore.isAuthorized) {
        navigation.navigate("Main");
      }
    })();
  }, [form, navigation, sessionDataStore]);

  return {
    form,
    handleSignUp,
  };
};
