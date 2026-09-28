export interface IUploadStatusInput {
  /** Доля отправленного 0..1. */
  progress: number;
  queue: { index: number; count: number } | null;
}

export interface IUploadStatusView {
  text: string;
  /** Бегущая полоса: файл отправлен, ждём ответа сервера. */
  indeterminate: boolean;
}

/**
 * Что показать о загрузке. Отправив файл целиком, клиент ждёт ответа, пока
 * сервер проверяет и сохраняет его, — это отдельная стадия, а не «висит на 100%».
 */
export const describeUpload = ({
  progress,
  queue,
}: IUploadStatusInput): IUploadStatusView => {
  const position =
    queue && queue.count > 1 ? `${queue.index} из ${queue.count}` : null;

  if (progress >= 1) {
    return {
      text: ["Обработка на сервере…", position].filter(Boolean).join(" "),
      indeterminate: true,
    };
  }

  return {
    text: [
      "Загрузка",
      position && `${position} ·`,
      `${Math.round(progress * 100)}%`,
    ]
      .filter(Boolean)
      .join(" "),
    indeterminate: false,
  };
};
