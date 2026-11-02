import { EPrivacyLevel } from "@shared/api/gen/main/model";
import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { usePrivacyVM } from "../usePrivacyVM";

const mockUserStore = {
  privacy: null as unknown,
  privacyError: null as { message: string } | null,
  loadPrivacy: jest.fn(async () => undefined),
  updatePrivacy: jest.fn(),
};
const mockNotifications = { error: jest.fn() };

jest.mock("@entities/user", () => ({
  IUserStore: { useInstance: () => mockUserStore },
}));
jest.mock("@shared/lib/http", () =>
  jest.requireActual("@shared/lib/http/middleware/notify-errors.middleware"),
);
jest.mock("@shared/lib/notifications", () => ({
  useNotifications: () => mockNotifications,
}));

const renderVM = async () => {
  const ref: { current: ReturnType<typeof usePrivacyVM> | null } = {
    current: null,
  };
  const Probe = () => {
    ref.current = usePrivacyVM();

    return null;
  };

  await act(async () => {
    TestRenderer.create(createElement(Probe));
  });

  return ref.current!;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUserStore.privacy = null;
  mockUserStore.privacyError = null;
  // react-test-renderer предупреждает об устаревании в console.error.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("usePrivacyVM.change", () => {
  it("5xx уже показан глобально — второго тоста нет", async () => {
    mockUserStore.updatePrivacy.mockResolvedValue({
      error: { message: "Внутренняя ошибка", status: 500 },
    });
    const vm = await renderVM();

    await act(() => vm.change("showAvatar", EPrivacyLevel.nobody));

    expect(mockNotifications.error).not.toHaveBeenCalled();
  });

  it("отмена запроса — не ошибка", async () => {
    mockUserStore.updatePrivacy.mockResolvedValue({
      error: { message: "canceled", isCanceled: true },
    });
    const vm = await renderVM();

    await act(() => vm.change("showAvatar", EPrivacyLevel.nobody));

    expect(mockNotifications.error).not.toHaveBeenCalled();
  });

  it("4xx показывается сообщением сервера", async () => {
    mockUserStore.updatePrivacy.mockResolvedValue({
      error: { message: "Недопустимое значение", status: 400 },
    });
    const vm = await renderVM();

    await act(() => vm.change("showAvatar", EPrivacyLevel.nobody));

    expect(mockNotifications.error).toHaveBeenCalledWith(
      "Недопустимое значение",
    );
  });

  it("успех — без тоста", async () => {
    mockUserStore.updatePrivacy.mockResolvedValue({ data: {} });
    const vm = await renderVM();

    await act(() => vm.change("showAvatar", EPrivacyLevel.nobody));

    expect(mockNotifications.error).not.toHaveBeenCalled();
  });
});

describe("usePrivacyVM: загрузка", () => {
  it("ошибка загрузки — не вечная загрузка, а ошибка с повтором", async () => {
    mockUserStore.privacyError = { message: "Сервер недоступен" };
    const vm = await renderVM();

    expect(vm.isLoading).toBe(false);
    expect(vm.error).toBe("Сервер недоступен");

    vm.retry();

    expect(mockUserStore.loadPrivacy).toHaveBeenCalledTimes(2);
  });
});
