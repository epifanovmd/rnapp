export interface IDemoEchoData {
  text: string;
  /** Отдать воркеру файлы: входной — ключ хранилища, выход — `jobs/<id>/echo.txt`. */
  inputKey?: string;
  withOutput?: boolean;
}
