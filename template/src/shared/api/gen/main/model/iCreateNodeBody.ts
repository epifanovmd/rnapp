export interface ICreateNodeBody {
  name: string;
  /** @nullable */
  description?: string | null;
  /**
   * Публичный адрес (имя хоста или IP).
   * @nullable
   */
  host?: string | null;
  /**
   * Владелец; отличный от себя — только с правом `node:assign`.
   * @nullable
   */
  ownerId?: string | null;
}
