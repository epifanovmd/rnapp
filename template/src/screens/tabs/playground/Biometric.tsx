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
      const registerBiometricKey = async () => {
        const { keysExist } = await rnBiometrics.biometricKeysExist();

        if (!keysExist) {
          const { publicKey } = await rnBiometrics.createKeys();

          console.log("publicKey", publicKey);
        }
      };

      registerBiometricKey().then();

      const { success, signature, error } = await rnBiometrics.createSignature({
        promptMessage: "Sign in",
        payload: "EP3cw3umbiJAF_p9gcV0fjd4SMpr7zVfIC4ytPL__Pk",
      });

      console.log("signature", signature);

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
