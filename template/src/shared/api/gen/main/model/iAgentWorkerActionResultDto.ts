/**
 * Ответ на перезапуск и обновление воркера. Воркер свободен — заменён сразу
 * (`deferred: false`, у обновления — версии). Занят (`health.busy`) — замена
 * отложена до окончания работы (`deferred: true`, `pending`, `actionId`);
 * её итог — событие сокета `agent:action` с `id = actionId` и `deferred: true`.
 */
export interface IAgentWorkerActionResultDto {
  deferred: boolean;
  /** Что ждёт: `restart` | `update`. */
  pending?: string;
  /** Id действия: по нему узнаётся итог в `agent:action`. */
  actionId?: string;
  /** Обновление: новая версия воркера. */
  version?: string;
  /** Обновление: прежняя версия. */
  previous?: string;
}
