import { IAuthStore } from "@entities/auth";
import { IUserStore } from "@entities/user";
import { IMainApi } from "@shared/api";
import { notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { IStorageService } from "@shared/lib/storage";
import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import {
  clearEnrollment,
  IBiometricEnrollment,
  isDeviceRegistered,
  isEnabledFor,
  readEnrollment,
  writeEnrollment,
} from "./biometric-enrollment";
import {
  IBiometricOutcome,
  keyMissingOutcome,
  resolveDisableFailure,
  resolvePromptFailure,
  resolveVerifyFailure,
} from "./biometric-outcome";
import { getBiometryIcon, getBiometryLabel } from "./biometry-label";
import { IBiometricDevice, IBiometricSensor, IBiometricStore } from "./types";

/** Стор входа по биометрии; см. `IBiometricStore`. */
@injectable()
export class BiometricStore implements IBiometricStore {
  public sensor: IBiometricSensor | null = null;
  public enrollment: IBiometricEnrollment | null = null;
  public isBusy = false;

  private _loading: Promise<void> | null = null;

  constructor(
    @IMainApi() private _api: IMainApi,
    @IAuthStore() private _authStore: IAuthStore,
    @IUserStore() private _userStore: IUserStore,
    @IStorageService() private _storage: IStorageService,
    @INotificationService() private _notifications: INotificationService,
    @IBiometricDevice() private _device: IBiometricDevice,
  ) {
    makeAutoObservable<BiometricStore, "_loading">(
      this,
      { _loading: false },
      { autoBind: true },
    );
  }

  get isLoaded() {
    return this.sensor !== null;
  }

  get isSupported() {
    return !!this.sensor?.available;
  }

  get label() {
    return getBiometryLabel(this.sensor?.biometryType);
  }

  get icon() {
    return getBiometryIcon(this.sensor?.biometryType);
  }

  get isEnabled() {
    return isEnabledFor(this.enrollment, this._userStore.user?.id);
  }

  get canSignIn() {
    return this.isSupported && !!this.enrollment;
  }

  load() {
    if (!this._loading) this._loading = this._load();

    return this._loading;
  }

  async signIn({ auto = false }: { auto?: boolean } = {}) {
    await this.load();

    const current = this.enrollment;

    if (!current || this.isBusy) return;

    this._setBusy(true);

    try {
      await this._signIn(current, auto);
    } finally {
      this._setBusy(false);
    }
  }

  async enable() {
    const userId = this._userStore.user?.id;

    if (!userId || this.isBusy) return;

    this._setBusy(true);

    try {
      await this._enable(userId);
    } finally {
      this._setBusy(false);
    }
  }

  async disable() {
    const current = this.enrollment ?? readEnrollment(this._storage);

    if (!current || this.isBusy) return;

    this._setBusy(true);

    try {
      const res = await this._api.deleteDevice(current.deviceId, {
        notifyErrors: false,
      });
      const outcome = resolveDisableFailure(this.label, res.error);

      await this._forget();

      if (outcome) this._report(outcome);
      else this._notifications.success(`Вход по ${this.label} выключен`);
    } finally {
      this._setBusy(false);
    }
  }

  async sync() {
    await this.load();
    this._setSensor(await this._device.getSensor());

    const current = this.enrollment;

    if (!current || this.isBusy) return;
    if (!isEnabledFor(current, this._userStore.user?.id)) return;

    if (!(await this._device.keyExists())) {
      await this._api.deleteDevice(current.deviceId, { notifyErrors: false });
      await this._forget();

      return;
    }

    const res = await this._api.getDevices({ notifyErrors: false });

    if (res.data && !isDeviceRegistered(res.data.devices, current.deviceId)) {
      await this._forget();
    }
  }

  private async _load() {
    let enrollment = readEnrollment(this._storage);
    const legacyUserId = await this._device.readLegacyUserId();

    if (legacyUserId) {
      if (!enrollment) {
        const { deviceId } = await this._device.getIdentity();

        enrollment = { userId: legacyUserId, deviceId };
        writeEnrollment(this._storage, enrollment);
      }

      await this._device.clearLegacyUserId();
    }

    const sensor = await this._device.getSensor();

    this._setEnrollment(enrollment);
    this._setSensor(sensor);
  }

  private async _signIn(current: IBiometricEnrollment, auto: boolean) {
    const sensor = await this._device.getSensor();

    this._setSensor(sensor);

    const label = getBiometryLabel(sensor.biometryType);

    if (!sensor.available) {
      if (!auto) {
        this._notifications.error(
          `Вход по ${label} недоступен: датчик выключен или не настроен`,
        );
      }

      return;
    }

    if (!(await this._device.keyExists())) {
      await this._apply(keyMissingOutcome(label));

      return;
    }

    const nonceRes = await this._api.generateNonce(current, { auth: false });

    if (nonceRes.error || !nonceRes.data) {
      notifyApiError(this._notifications, nonceRes.error);

      return;
    }

    const { nonce } = nonceRes.data;
    const issuedAt = Date.now();
    const signed = await this._device.sign("Вход в приложение", nonce);

    if ("failure" in signed) {
      await this._apply(resolvePromptFailure(label, signed.failure, auto));

      return;
    }

    const verifyRes = await this._api.verifySignature(
      { ...current, nonce, signature: signed.signature },
      { auth: false },
    );

    if (verifyRes.error) {
      await this._apply(
        resolveVerifyFailure(label, verifyRes.error, Date.now() - issuedAt),
      );

      return;
    }

    if (verifyRes.data?.verified) {
      await this._authStore.restore(verifyRes.data.tokens);
    }
  }

  private async _enable(userId: string) {
    const label = this.label;
    const failure = await this._device.confirmPresence(
      `Включить вход по ${label}`,
    );

    if (failure) {
      this._report(resolvePromptFailure(label, failure, true));

      return;
    }

    let publicKey: string;

    try {
      publicKey = await this._device.createKey();
    } catch {
      this._notifications.error("Не удалось создать ключ на устройстве");

      return;
    }

    const { deviceId, deviceName } = await this._device.getIdentity();
    const res = await this._api.registerBiometric({
      deviceId,
      deviceName,
      publicKey,
    });

    if (res.error || !res.data?.registered) {
      // Новый ключ уже заменил прежний — прежняя регистрация не работает.
      await this._forget();

      if (res.error) notifyApiError(this._notifications, res.error);
      else this._notifications.error(`Не удалось включить вход по ${label}`);

      return;
    }

    const enrollment = { userId, deviceId };

    writeEnrollment(this._storage, enrollment);
    this._setEnrollment(enrollment);
    this._notifications.success(`Вход по ${label} включён`);
  }

  /** Забыть регистрацию и удалить ключ с устройства. */
  private async _forget() {
    clearEnrollment(this._storage);
    this._setEnrollment(null);
    await this._device.deleteKey();
  }

  private async _apply(outcome: IBiometricOutcome | null) {
    if (outcome?.reset) await this._forget();
    this._report(outcome);
  }

  private _report(outcome: IBiometricOutcome | null) {
    if (outcome) this._notifications[outcome.level](outcome.message);
  }

  private _setBusy(value: boolean) {
    this.isBusy = value;
  }

  private _setSensor(sensor: IBiometricSensor) {
    this.sensor = sensor;
  }

  private _setEnrollment(enrollment: IBiometricEnrollment | null) {
    this.enrollment = enrollment;
  }
}
