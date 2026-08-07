/** Обнаруженный объект для JS-потребителя (метка уже размаплена) */
export interface IDetectedObjectInfo {
  /** Индекс класса модели; -1 — модель вернула только метку */
  classIndex: number;
  /** Метка: из модели (CoreML), из переданного списка или "#<индекс>" */
  label: string;
  score: number;
}
