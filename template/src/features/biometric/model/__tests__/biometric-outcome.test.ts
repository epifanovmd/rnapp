import {
  keyMissingOutcome,
  NONCE_TTL_MS,
  resolveDisableFailure,
  resolvePromptFailure,
  resolveVerifyFailure,
} from "../biometric-outcome";

describe("resolvePromptFailure", () => {
  it("отмена — по-русски, без сброса", () => {
    expect(resolvePromptFailure("Face ID", { canceled: true })).toEqual({
      level: "info",
      message: "Вход по Face ID отменён",
      reset: false,
    });
  });

  it("отмена при автозапросе или включении — молча", () => {
    expect(
      resolvePromptFailure("Face ID", { canceled: true }, true),
    ).toBeNull();
  });

  it("ключ не найден (iOS) или аннулирован (Android) — сброс регистрации", () => {
    expect(
      resolvePromptFailure("Face ID", {
        canceled: false,
        message: "Key not found: errSecItemNotFound",
      }),
    ).toEqual(keyMissingOutcome("Face ID"));
    expect(
      resolvePromptFailure("отпечатку", {
        canceled: false,
        message: "Error signing payload: Key permanently invalidated",
      })?.reset,
    ).toBe(true);
  });

  it.each([
    "Too many attempts. Try again later.",
    'Signature error: Code=-8 "Biometry is locked out."',
    "Слишком много попыток. Повторите позже.",
  ])("блокировка датчика (%s) — понятный текст, без сброса", message => {
    expect(
      resolvePromptFailure("Face ID", { canceled: false, message }),
    ).toMatchObject({
      level: "error",
      reset: false,
      message: expect.stringContaining("Датчик заблокирован"),
    });
  });

  it("прочая ошибка модуля — тост без сброса", () => {
    expect(
      resolvePromptFailure("Touch ID", { canceled: false, message: "boom" }),
    ).toEqual({
      level: "error",
      message: "Не удалось подтвердить вход по Touch ID",
      reset: false,
    });
  });
});

describe("resolveVerifyFailure", () => {
  it("401 в срок nonce — ключ отозван на сервере, сброс", () => {
    expect(
      resolveVerifyFailure(
        "Face ID",
        { status: 401, message: "Биометрическая проверка не пройдена" },
        2000,
      ),
    ).toEqual(keyMissingOutcome("Face ID"));
  });

  it("401 после истечения nonce — повторить, без сброса", () => {
    expect(
      resolveVerifyFailure(
        "Face ID",
        { status: 401, message: "x" },
        NONCE_TTL_MS,
      ),
    ).toMatchObject({ level: "warning", reset: false });
  });

  it("429 — сообщение сервера без сброса", () => {
    expect(
      resolveVerifyFailure(
        "Face ID",
        { status: 429, message: "Слишком много запросов" },
        0,
      ),
    ).toEqual({
      level: "error",
      message: "Слишком много запросов",
      reset: false,
    });
  });

  it("сеть и 5xx — без тоста и без сброса (тост показал HTTP-клиент)", () => {
    expect(resolveVerifyFailure("Face ID", { message: "net" }, 0)).toBeNull();
    expect(
      resolveVerifyFailure("Face ID", { status: 502, message: "x" }, 0),
    ).toBeNull();
  });
});

describe("resolveDisableFailure", () => {
  it("успех и 404 — устройства на сервере нет, без тоста", () => {
    expect(resolveDisableFailure("Face ID", undefined)).toBeNull();
    expect(
      resolveDisableFailure("Face ID", { status: 404, message: "x" }),
    ).toBeNull();
  });

  it("сервер недоступен — предупреждение", () => {
    expect(resolveDisableFailure("Face ID", { message: "net" })).toMatchObject({
      level: "warning",
    });
  });
});
