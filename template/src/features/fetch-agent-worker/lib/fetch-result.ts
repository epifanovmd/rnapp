import type {
  IAgentManifestRouteDto,
  IAgentWorkerDto,
} from "@shared/api/gen/main/model";

/** Методы запроса к воркеру. */
export const FETCH_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type TFetchMethod = (typeof FETCH_METHODS)[number];

/** Заголовок ответа: статус ответа самого воркера (не ошибка API). */
const WORKER_STATUS_HEADER = "x-agent-worker-status";

/** Итог запроса к воркеру. */
export interface IWorkerFetchResult {
  /** Ответ 2xx. */
  ok: boolean;
  /** HTTP-статус; у успешного ответа без статуса — `null`. */
  status: number | null;
  /** Ответил воркер (а не сервер ошибкой API). */
  fromWorker: boolean;
  /** Тело как текст; JSON — с отступами. */
  body: string;
}

/** Текст тела: JSON — с отступами, остальное как есть. */
export const prettyBody = (body: unknown): string => {
  if (body === undefined || body === null) return "";
  if (typeof body !== "string") return JSON.stringify(body, null, 2);

  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
};

/** Успешный ответ воркера. */
export const fetchSuccess = (body: unknown): IWorkerFetchResult => ({
  ok: true,
  status: null,
  fromWorker: true,
  body: prettyBody(body),
});

/** Ошибка: статус, тело и чей ответ — по заголовку статуса воркера. */
export const fetchFailure = (error: {
  message: string;
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
}): IWorkerFetchResult => {
  const headers = Object.fromEntries(
    Object.entries(error.headers ?? {}).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );
  const workerStatus = Number(headers[WORKER_STATUS_HEADER]);
  const fromWorker = Number.isFinite(workerStatus) && workerStatus > 0;

  return {
    ok: false,
    status: fromWorker ? workerStatus : (error.status ?? null),
    fromWorker,
    body: prettyBody(error.body) || error.message,
  };
};

/** Маршруты воркера из манифеста; без манифеста — нет. */
export const workerRoutes = (
  worker: Pick<IAgentWorkerDto, "manifest"> | undefined,
): IAgentManifestRouteDto[] => worker?.manifest?.routes ?? [];

/** Метод маршрута, если он из поддерживаемых; иначе — GET. */
export const routeMethod = (route: Pick<IAgentManifestRouteDto, "method">) => {
  const method = route.method.toUpperCase();

  return (FETCH_METHODS as readonly string[]).includes(method)
    ? (method as TFetchMethod)
    : "GET";
};

/** Тело запроса нужно методу. */
export const methodHasBody = (method: TFetchMethod): boolean =>
  method !== "GET" && method !== "DELETE";
