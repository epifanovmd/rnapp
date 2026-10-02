import { getBiometryIcon, getBiometryLabel } from "../biometry-label";

describe("getBiometryLabel", () => {
  it("название по типу датчика — для подписей «Вход по …»", () => {
    expect(getBiometryLabel("FaceID")).toBe("Face ID");
    expect(getBiometryLabel("TouchID")).toBe("Touch ID");
    expect(getBiometryLabel("Biometrics")).toBe("отпечатку");
    expect(getBiometryLabel(undefined)).toBe("отпечатку");
  });
});

describe("getBiometryIcon", () => {
  it("лицо для Face ID, отпечаток для остальных", () => {
    expect(getBiometryIcon("FaceID")).toBe("scanFace");
    expect(getBiometryIcon("TouchID")).toBe("fingerprint");
    expect(getBiometryIcon(undefined)).toBe("fingerprint");
  });
});
