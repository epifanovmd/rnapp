import { Button } from "@components";
import { Col } from "@force-dev/react-mobile";
import React, { FC, memo, PropsWithChildren, useCallback } from "react";
import ReactNativeBiometrics, { BiometryTypes } from "react-native-biometrics";

export interface IBiometricProps {}

const _Biometric: FC<PropsWithChildren<IBiometricProps>> = () => {
  const onPress = useCallback(async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    if (available && biometryType === BiometryTypes.FaceID) {
      // const { success, signature, error } = await rnBiometrics.createSignature({
      //   promptMessage: "Sign in",
      //   payload,
      // });
      //
      // console.log("success", success);
      // console.log("error", error);
      // console.log("signature", signature);

      const { success, error } = await rnBiometrics.simplePrompt({
        promptMessage: "123",
      });

      console.log("success", success);
      console.log("error", error);
    }
  }, []);

  return (
    <Col>
      <Button onPress={onPress}>Biometric</Button>
    </Col>
  );
};

export const Biometric = memo(_Biometric);
