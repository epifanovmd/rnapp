import { keepLocalCopy, pick } from "@react-native-documents/picker";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";

import { pickDocuments, pickPhotos, takePhoto } from "../media-picker";
import { MediaPickerError } from "../media-picker.types";

jest.mock("react-native-image-picker", () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock("@react-native-documents/picker", () => ({
  errorCodes: { OPERATION_CANCELED: "OPERATION_CANCELED" },
  types: { allFiles: "*/*" },
  isErrorWithCode: (error: { code?: unknown }) =>
    typeof error?.code === "string",
  pick: jest.fn(),
  keepLocalCopy: jest.fn(),
}));

const mocked = (fn: unknown) => fn as jest.Mock;

describe("media-picker", () => {
  afterEach(() => jest.clearAllMocks());

  it("фото из галереи: ассеты → файлы, лимит передаётся", async () => {
    mocked(launchImageLibrary).mockResolvedValue({
      assets: [{ uri: "file:///a.jpg", fileName: "a.jpg", type: "image/jpeg" }],
    });

    const files = await pickPhotos({ limit: 3 });

    expect(mocked(launchImageLibrary).mock.calls[0][0]).toMatchObject({
      mediaType: "photo",
      selectionLimit: 3,
    });
    expect(files).toEqual([
      { uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg" },
    ]);
  });

  it("отмена — пустой список, не ошибка", async () => {
    mocked(launchCamera).mockResolvedValue({ didCancel: true });

    await expect(takePhoto()).resolves.toEqual([]);
  });

  it("нет доступа к камере — MediaPickerError(permission)", async () => {
    mocked(launchCamera).mockResolvedValue({ errorCode: "permission" });

    const error = await takePhoto().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MediaPickerError);
    expect((error as MediaPickerError).code).toBe("permission");
  });

  it("документы: отправляется локальная копия, несскопированные пропускаются", async () => {
    mocked(pick).mockResolvedValue([
      { uri: "content://a", name: "a.pdf", type: "application/pdf", size: 5 },
      { uri: "content://b", name: "b.txt", type: "text/plain", size: 1 },
    ]);
    mocked(keepLocalCopy).mockResolvedValue([
      {
        status: "success",
        sourceUri: "content://a",
        localUri: "file:///c/a.pdf",
      },
      { status: "error", sourceUri: "content://b", copyError: "io" },
    ]);

    await expect(pickDocuments()).resolves.toEqual([
      {
        uri: "file:///c/a.pdf",
        name: "a.pdf",
        type: "application/pdf",
        size: 5,
      },
    ]);
  });

  it("отмена выбора документов — пустой список", async () => {
    mocked(pick).mockRejectedValue({ code: "OPERATION_CANCELED" });

    await expect(pickDocuments()).resolves.toEqual([]);
  });
});
