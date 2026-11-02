import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useAppBootstrap } from "../useAppBootstrap";

const mockAuth = { isAuthenticated: false, restore: jest.fn() };
const mockBiometric = { load: jest.fn(), signIn: jest.fn() };
const mockHideSplash = jest.fn();

jest.mock("@entities/auth", () => ({
  IAuthStore: { useInstance: () => mockAuth },
}));
jest.mock("@features/biometric", () => ({
  IBiometricStore: { useInstance: () => mockBiometric },
}));
jest.mock("@shared/lib/splash", () => ({
  AppSplash: { hide: (...args: unknown[]) => mockHideSplash(...args) },
}));
jest.mock("react-native-haptic-feedback", () => ({
  HapticFeedbackTypes: { impactLight: "impactLight" },
  trigger: jest.fn(),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const renderBootstrap = async () => {
  let onReady!: () => Promise<void>;
  const Probe = () => {
    onReady = useAppBootstrap();

    return null;
  };

  await act(async () => {
    TestRenderer.create(createElement(Probe));
  });

  return onReady;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  mockAuth.restore.mockReset().mockResolvedValue(undefined);
  mockBiometric.load.mockReset().mockResolvedValue(undefined);
  mockBiometric.signIn.mockReset();
  mockHideSplash.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("useAppBootstrap", () => {
  it("сбой загрузки биометрии не оставляет приложение под splash", async () => {
    mockBiometric.load.mockRejectedValue(new Error("AsyncStorage недоступен"));
    const onReady = await renderBootstrap();

    await onReady().catch(() => undefined);
    jest.runAllTimers();

    expect(mockHideSplash).toHaveBeenCalledTimes(1);
  });

  it("без сессии — автозапрос биометрии после скрытия splash", async () => {
    const onReady = await renderBootstrap();

    await onReady();
    jest.runAllTimers();

    expect(mockHideSplash).toHaveBeenCalledTimes(1);
    expect(mockBiometric.signIn).toHaveBeenCalledWith({ auto: true });
  });
});
