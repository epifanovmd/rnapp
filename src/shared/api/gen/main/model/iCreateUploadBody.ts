/**
 * Запрос прямой загрузки.
 */
export interface ICreateUploadBody {
  /** Исходное имя файла (с расширением из белого списка). */
  name: string;
  /** Точный размер, байт. */
  size: number;
  /** MIME-тип; должен соответствовать расширению. */
  contentType: string;
}
