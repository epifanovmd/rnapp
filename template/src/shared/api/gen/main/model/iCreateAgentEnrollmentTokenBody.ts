import type { RecordStringString } from "./recordStringString";

export interface ICreateAgentEnrollmentTokenBody {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /** Метки, которые получат агенты: `zone`, `gpu`. */
  labels?: RecordStringString;
  /** Сколько агентов можно зарегистрировать; без него — без ограничения. */
  maxUses?: number;
  /** Срок действия; без него — бессрочный. */
  expiresAt?: string;
}
