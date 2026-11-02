export interface ICreateApiKeyBody {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /** Разрешения: `reports:export`, `reports:*`. */
  scopes: string[];
  /** Срок действия; без него ключ бессрочный. */
  expiresAt?: string;
}
