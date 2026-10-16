import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useCancelJob } from "../useCancelJob";

const mockCancel = jest.fn();
const mockNotify = jest.fn();
const mockNotifications = {};

jest.mock("@entities/job", () => ({
  IJobStore: { useInstance: () => ({ cancel: mockCancel }) },
}));
jest.mock("@shared/lib/http", () => ({
  notifyApiError: (...args: unknown[]) => mockNotify(...args),
}));
jest.mock("@shared/lib/notifications", () => ({
  useNotifications: () => mockNotifications,
}));

const renderCancelJob = async () => {
  const ref: { current: ReturnType<typeof useCancelJob> | null } = {
    current: null,
  };
  const Probe = () => {
    ref.current = useCancelJob();

    return null;
  };

  await act(async () => {
    TestRenderer.create(createElement(Probe));
  });

  return ref.current!;
};

beforeEach(() => {
  jest.clearAllMocks();
  // react-test-renderer предупреждает об устаревании в console.error.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useCancelJob", () => {
  it("отменяет задачу", async () => {
    mockCancel.mockResolvedValue({ data: undefined });
    const cancelJob = await renderCancelJob();

    await expect(cancelJob("j-1")).resolves.toBe(true);
    expect(mockCancel).toHaveBeenCalledWith("j-1");
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("ошибка отмены — уведомление", async () => {
    const error = { message: "Задача уже завершена" };

    mockCancel.mockResolvedValue({ error });
    const cancelJob = await renderCancelJob();

    await expect(cancelJob("j-1")).resolves.toBe(false);
    expect(mockNotify).toHaveBeenCalledWith(mockNotifications, error);
  });
});
