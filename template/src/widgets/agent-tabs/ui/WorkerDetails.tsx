import type {
  IAgentWorkerConfigReportDto,
  IAgentWorkerDto,
} from "@shared/api/gen/main/model";
import { Col, Tag, Text } from "@shared/ui";
import React, { FC } from "react";

import { JsonBlock } from "./JsonBlock";
import { WorkerManifestSection } from "./WorkerManifestSection";

interface IWorkerDetailsProps {
  worker: IAgentWorkerDto;
  /** Последний ответ `GET /metrics` воркера. */
  metrics: unknown;
}

const reportTag = (report: IAgentWorkerConfigReportDto) => (
  <Tag
    variant={
      report.ok === undefined ? "info" : report.ok ? "success" : "destructive"
    }
  >
    {`v${report.version}${
      report.ok === undefined ? " · применяется" : report.ok ? "" : " · ошибка"
    }`}
  </Tag>
);

/**
 * Подробности воркера: возможности из манифеста (ключи настроек с итогом
 * применения, маршруты, события, задачи, запросы к серверу), сведения из
 * `/health` и метрики из `/metrics`.
 */
export const WorkerDetails: FC<IWorkerDetailsProps> = ({ worker, metrics }) => {
  const manifest = worker.manifest;
  const info = worker.health?.info;

  return (
    <Col gap={12} bg={"onSurface"} radius={12} pa={12}>
      {worker.builtin ? (
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {"Встроенный воркер собирает метрики узла — они на вкладке «Обзор»."}
        </Text>
      ) : !manifest ? (
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {
            "Манифеста нет: воркер ещё не проверен или ответил на GET /manifest не так, как нужно."
          }
        </Text>
      ) : (
        <>
          {!!manifest.description && (
            <Text textStyle={"Body_S2"}>{manifest.description}</Text>
          )}
          <WorkerManifestSection
            title={"Ключи настроек"}
            items={manifest.configs.map(config => {
              const report = worker.configs?.[config.key];

              return {
                key: config.key,
                name: config.key,
                description: config.description,
                extra: report && reportTag(report),
                footer: report?.error && (
                  <Text textStyle={"Caption_M3"} color={"danger"}>
                    {report.error.message}
                  </Text>
                ),
              };
            })}
          />
          <WorkerManifestSection
            title={"Маршруты"}
            items={manifest.routes.map(route => ({
              key: `${route.method} ${route.path}`,
              name: `${route.method.toUpperCase()} ${route.path}`,
              description: route.description,
            }))}
          />
          <WorkerManifestSection
            title={"События"}
            items={manifest.events.map(event => ({
              key: event.type,
              name: event.type,
              description: event.description,
            }))}
          />
          <WorkerManifestSection
            title={"Задачи"}
            items={manifest.jobs.map(job => ({
              key: job.type,
              name: job.type,
              description: job.description,
            }))}
          />
          <WorkerManifestSection
            title={"Запросы к серверу"}
            items={manifest.requests.map(request => ({
              key: request.type,
              name: request.type,
              description: request.description,
            }))}
          />
        </>
      )}
      {!!info && Object.keys(info).length > 0 && (
        <JsonBlock title={"Сведения воркера (health.info)"} value={info} />
      )}
      {metrics !== undefined && !worker.builtin && (
        <JsonBlock title={"Метрики воркера (/metrics)"} value={metrics} />
      )}
    </Col>
  );
};
