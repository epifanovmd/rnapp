import type { IFileDto } from "@shared/api/gen/main/model";
import { createInjectDecorator, SupportInitialize } from "@shared/lib/di";
import type { ILocalFile } from "@shared/lib/files";
import type { InfiniteHolder } from "@shared/lib/holders";
import type { ApiError, ApiResponse } from "@shared/lib/http";

export const IFileStore = createInjectDecorator<IFileStore>("IFileStore");

/** Позиция в пачке загрузки: `index` из `count`, с единицы. */
export interface IUploadQueueState {
  index: number;
  count: number;
}

export interface IUploadManyResult {
  uploaded: IFileDto[];
  errors: ApiError[];
}

/** Файлы текущего пользователя: список страницами, загрузка, удаление. */
export interface IFileStore {
  readonly filesHolder: InfiniteHolder<IFileDto>;
  readonly files: IFileDto[];
  /** Мои изображения из загруженного списка — кандидаты в аватар. */
  readonly images: IFileDto[];
  readonly isUploading: boolean;
  /** Доля отправленного файла 0..1; `null` — загрузки нет. */
  readonly uploadProgress: number | null;
  readonly uploadQueue: IUploadQueueState | null;

  load(): Promise<void>;
  refresh(): Promise<void>;
  loadMore(): Promise<void>;
  /** Загрузить файл; загруженный встаёт в начало списка. */
  upload(file: ILocalFile): Promise<ApiResponse<IFileDto, ApiError>>;
  /** Загрузить пачку по одному; ошибка файла не останавливает остальные. */
  uploadMany(files: readonly ILocalFile[]): Promise<IUploadManyResult>;
  remove(id: string): Promise<ApiResponse<void, ApiError>>;
  /** Файл загружен на другом устройстве (`file:uploaded`): в начало списка. */
  handleFileUploaded(file: IFileDto): void;
  /** Файл удалён на другом устройстве (`file:deleted`): убрать из списка. */
  handleFileDeleted(id: string): void;
  /** Файл обработан сервером (`file:processed`): обновить его в списке. */
  handleFileProcessed(file: IFileDto): void;
  reset(): void;
}

export const IFileRealtime =
  createInjectDecorator<IFileRealtime>("IFileRealtime");

/** Подписка на `file:uploaded`/`processed`/`deleted` на время авторизованной сессии. */
export type IFileRealtime = SupportInitialize;
