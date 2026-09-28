/** Почему выбор не удался; отмена пользователем ошибкой не считается. */
export type TMediaPickerErrorCode = "permission" | "unavailable" | "failed";

const MESSAGES: Record<TMediaPickerErrorCode, string> = {
  permission: "Нет доступа. Разрешите его в настройках устройства.",
  unavailable: "Источник недоступен на этом устройстве.",
  failed: "Не удалось получить файл.",
};

export class MediaPickerError extends Error {
  constructor(
    readonly code: TMediaPickerErrorCode,
    readonly detail?: string,
  ) {
    super(MESSAGES[code]);
    this.name = "MediaPickerError";
  }
}

export interface IPickPhotosOptions {
  /** Сколько фото можно выбрать; 0 — без ограничения. */
  limit?: number;
}

export interface IPickDocumentsOptions {
  multiple?: boolean;
}
