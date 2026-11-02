import AsyncStorage from "@react-native-async-storage/async-storage";
import { injectable } from "inversify";
import ReactNativeBiometrics from "react-native-biometrics";
import DeviceInfo from "react-native-device-info";

import { normalizeBase64, toDeviceName } from "./biometric-payload";
import type {
  IBiometricDevice,
  IBiometricSensor,
  TBiometricSignature,
} from "./types";

/** Ключ прежней версии фичи в AsyncStorage. */
const LEGACY_USER_ID_KEY = "biometricUserId";
const CANCEL_TEXT = "Отмена";

const toMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/** `react-native-biometrics` + `react-native-device-info`. */
@injectable()
export class NativeBiometricDevice implements IBiometricDevice {
  private readonly _biometrics = new ReactNativeBiometrics();

  async getSensor(): Promise<IBiometricSensor> {
    try {
      const { available, biometryType } =
        await this._biometrics.isSensorAvailable();

      return { available, biometryType };
    } catch {
      return { available: false };
    }
  }

  async confirmPresence(promptMessage: string) {
    try {
      const { success } = await this._biometrics.simplePrompt({
        promptMessage,
        cancelButtonText: CANCEL_TEXT,
      });

      return success ? null : { canceled: true };
    } catch (error) {
      return { canceled: false, message: toMessage(error) };
    }
  }

  async sign(
    promptMessage: string,
    payload: string,
  ): Promise<TBiometricSignature> {
    try {
      const { success, signature } = await this._biometrics.createSignature({
        promptMessage,
        payload,
        cancelButtonText: CANCEL_TEXT,
      });

      return success && signature
        ? { signature: normalizeBase64(signature) }
        : { failure: { canceled: true } };
    } catch (error) {
      return { failure: { canceled: false, message: toMessage(error) } };
    }
  }

  async createKey() {
    const { publicKey } = await this._biometrics.createKeys();

    return normalizeBase64(publicKey);
  }

  async keyExists() {
    try {
      const { keysExist } = await this._biometrics.biometricKeysExist();

      return keysExist;
    } catch {
      return false;
    }
  }

  async deleteKey() {
    try {
      await this._biometrics.deleteKeys();
    } catch {
      // Ключа нет — удалять нечего.
    }
  }

  async getIdentity() {
    const [deviceId, deviceName] = await Promise.all([
      DeviceInfo.getUniqueId(),
      DeviceInfo.getDeviceName().catch(() => ""),
    ]);

    return {
      deviceId,
      deviceName: toDeviceName(deviceName, DeviceInfo.getModel()),
    };
  }

  async readLegacyUserId() {
    try {
      return await AsyncStorage.getItem(LEGACY_USER_ID_KEY);
    } catch {
      return null;
    }
  }

  async clearLegacyUserId() {
    try {
      await AsyncStorage.removeItem(LEGACY_USER_ID_KEY);
    } catch {
      // Нечего удалять.
    }
  }
}
