import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useDeleteFile } from "../useDeleteFile";

const mockConfirm = jest.fn();
const mockRemove = jest.fn();
const mockNotify = jest.fn();
const mockNotifications = {};

jest.mock("@entities/file", () => ({
  IFileStore: { useInstance: () => ({ remove: mockRemove }) },
}));
jest.mock("@shared/lib/http", () => ({
  notifyApiError: (...args: unknown[]) => mockNotify(...args),
}));
jest.mock("@shared/lib/notifications", () => ({
  useNotifications: () => mockNotifications,
}));
jest.mock("@shared/ui", () => ({ useConfirm: () => mockConfirm }));

const file = { id: "f-1", name: "photo.png" } as never;

const renderDeleteFile = async () => {
  const ref: { current: ReturnType<typeof useDeleteFile> | null } = {
    current: null,
  };
  const Probe = () => {
    ref.current = useDeleteFile();

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

describe("useDeleteFile", () => {
  it("отказ в подтверждении — файл не удаляется", async () => {
    mockConfirm.mockResolvedValue(false);
    const deleteFile = await renderDeleteFile();

    await expect(deleteFile(file)).resolves.toBe(false);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("подтверждено — удаляет файл", async () => {
    mockConfirm.mockResolvedValue(true);
    mockRemove.mockResolvedValue({ data: undefined });
    const deleteFile = await renderDeleteFile();

    await expect(deleteFile(file)).resolves.toBe(true);
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ description: "photo.png" }),
    );
    expect(mockRemove).toHaveBeenCalledWith("f-1");
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("ошибка удаления — уведомление", async () => {
    const error = { message: "Нет доступа" };

    mockConfirm.mockResolvedValue(true);
    mockRemove.mockResolvedValue({ error });
    const deleteFile = await renderDeleteFile();

    await expect(deleteFile(file)).resolves.toBe(false);
    expect(mockNotify).toHaveBeenCalledWith(mockNotifications, error);
  });
});
