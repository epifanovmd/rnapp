import { configuredWorkers, formatJson, schemaSkeleton } from "@entities/agent";
import { IMainApi } from "@shared/api";
import type {
  AgentDto,
  IAgentManifestRouteDto,
} from "@shared/api/gen/main/model";
import { isHttpError } from "@shared/lib/http";
import { useState } from "react";

import {
  fetchFailure,
  fetchSuccess,
  type IWorkerFetchResult,
  methodHasBody,
  routeMethod,
  type TFetchMethod,
  workerRoutes,
} from "../lib/fetch-result";

/** Срок ответа воркера, мс. */
const FETCH_TIMEOUT_MS = 30_000;

/**
 * Запрос к воркеру через агента: воркер, маршрут из манифеста (или свой
 * путь), метод и JSON-тело; ответ — статус и тело. Изменяющие запросы сервер
 * пишет в журнал аудита.
 */
export const useWorkerFetchVM = (agent: AgentDto) => {
  const api = IMainApi.useInstance();
  const workers = configuredWorkers(agent);
  const [worker, setWorkerState] = useState<string | null>(
    workers[0]?.name ?? null,
  );
  const [method, setMethod] = useState<TFetchMethod>("GET");
  const [path, setPath] = useState("/");
  const [body, setBody] = useState("");
  const [isSending, setSending] = useState(false);
  const [result, setResult] = useState<IWorkerFetchResult | null>(null);

  const routes = workerRoutes(workers.find(item => item.name === worker));

  const setWorker = (next: string) => {
    setWorkerState(next);
    setResult(null);
  };

  /** Маршрут из манифеста: метод, путь и заготовка тела по схеме. */
  const pickRoute = (route: IAgentManifestRouteDto) => {
    const nextMethod = routeMethod(route);

    setMethod(nextMethod);
    setPath(route.path);
    setBody(
      methodHasBody(nextMethod) && route.request
        ? formatJson(schemaSkeleton(route.request))
        : "",
    );
  };

  const send = async () => {
    if (!worker || isSending) return;

    const withBody = methodHasBody(method) && body.trim() !== "";

    setSending(true);

    const res = await api.fetchAgentWorker(
      agent.id,
      worker,
      {
        method,
        path: path.startsWith("/") ? path : `/${path}`,
        ...(withBody && {
          body,
          headers: { "Content-Type": "application/json" },
        }),
        timeoutMs: FETCH_TIMEOUT_MS,
      },
      { responseType: "text", notifyErrors: false },
    );

    setSending(false);

    if (res.error) {
      setResult(
        fetchFailure({
          message: res.error.message,
          status: res.error.status,
          headers: isHttpError(res.error) ? res.error.headers : undefined,
          body: isHttpError(res.error) ? res.error.body : undefined,
        }),
      );

      return;
    }

    setResult(fetchSuccess(res.data));
  };

  return {
    workers: workers.map(item => item.name),
    worker,
    setWorker,
    routes,
    pickRoute,
    method,
    setMethod,
    path,
    setPath,
    body,
    setBody,
    hasBody: methodHasBody(method),
    send,
    isSending,
    result,
  };
};

export type WorkerFetchVM = ReturnType<typeof useWorkerFetchVM>;
