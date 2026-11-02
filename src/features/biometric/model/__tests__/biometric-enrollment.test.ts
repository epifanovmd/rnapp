import {
  BIOMETRIC_STORAGE_KEY,
  clearEnrollment,
  isDeviceRegistered,
  isEnabledFor,
  parseEnrollment,
  readEnrollment,
  writeEnrollment,
} from "../biometric-enrollment";

const createStorage = () => {
  const map = new Map<string, string>();

  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
};

describe("parseEnrollment", () => {
  it("читает корректную запись", () => {
    expect(parseEnrollment('{"userId":"u1","deviceId":"d1"}')).toEqual({
      userId: "u1",
      deviceId: "d1",
    });
  });

  it.each([
    null,
    "",
    "u1",
    "{",
    "null",
    "[]",
    '{"userId":"u1"}',
    '{"userId":1,"deviceId":"d"}',
  ])("битое значение %p — null", raw => {
    expect(parseEnrollment(raw)).toBeNull();
  });
});

describe("хранилище", () => {
  it("запись, чтение и сброс", () => {
    const storage = createStorage();

    expect(readEnrollment(storage)).toBeNull();
    writeEnrollment(storage, { userId: "u1", deviceId: "d1" });
    expect(storage.map.has(BIOMETRIC_STORAGE_KEY)).toBe(true);
    expect(readEnrollment(storage)).toEqual({ userId: "u1", deviceId: "d1" });
    clearEnrollment(storage);
    expect(readEnrollment(storage)).toBeNull();
  });
});

describe("isEnabledFor", () => {
  const enrollment = { userId: "u1", deviceId: "d1" };

  it("включено только для пользователя, который его включал", () => {
    expect(isEnabledFor(enrollment, "u1")).toBe(true);
    expect(isEnabledFor(enrollment, "u2")).toBe(false);
    expect(isEnabledFor(enrollment, undefined)).toBe(false);
    expect(isEnabledFor(null, "u1")).toBe(false);
  });
});

describe("isDeviceRegistered", () => {
  it("ищет устройство в списке сервера", () => {
    const devices = [{ deviceId: "d1" }, { deviceId: "d2" }];

    expect(isDeviceRegistered(devices, "d2")).toBe(true);
    expect(isDeviceRegistered(devices, "d3")).toBe(false);
    expect(isDeviceRegistered([], "d1")).toBe(false);
  });
});
