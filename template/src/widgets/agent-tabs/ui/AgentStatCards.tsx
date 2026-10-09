import {
  formatCount,
  formatPercent,
  formatRate,
  formatUsage,
  type IAgentHostMetrics,
  usagePercent,
} from "@entities/agent";
import { Col, Row, StatCard } from "@shared/ui";
import React, { FC } from "react";

interface IAgentStatCardsProps {
  /** Показатели узла по свежей точке; агент их не присылал — `undefined`. */
  host: IAgentHostMetrics | undefined;
  /** Сколько важных сообщений агента ждут подтверждения сервера. */
  outbox: number | undefined;
}

/** Порог «почти заполнено», %. */
const WARN_PERCENT = 90;

const toneOf = (value: number | null | undefined) =>
  (value ?? 0) >= WARN_PERCENT ? "warning" : undefined;

/** Главные показатели узла сеткой в две колонки. */
export const AgentStatCards: FC<IAgentStatCardsProps> = ({ host, outbox }) => {
  const memory = usagePercent(host?.memUsedBytes, host?.memTotalBytes);
  const disk = usagePercent(host?.diskUsedBytes, host?.diskTotalBytes);
  const cores = host?.cpuCores.length;

  return (
    <Col gap={12}>
      <Row gap={12}>
        <StatCard
          label={"Процессор"}
          value={formatPercent(host?.cpuPercent)}
          hint={cores ? `ядер: ${cores}` : undefined}
          icon={"cpu"}
          tone={toneOf(host?.cpuPercent)}
        />
        <StatCard
          label={"Память"}
          value={formatPercent(memory)}
          hint={formatUsage(host?.memUsedBytes, host?.memTotalBytes)}
          icon={"layers"}
          tone={toneOf(memory)}
        />
      </Row>
      <Row gap={12}>
        <StatCard
          label={"Диск /"}
          value={formatPercent(disk)}
          hint={formatUsage(host?.diskUsedBytes, host?.diskTotalBytes)}
          icon={"hardDrive"}
          tone={toneOf(disk)}
        />
        <StatCard
          label={"Нагрузка"}
          value={host?.load1 == null ? "—" : host.load1.toFixed(2)}
          hint={
            host?.load5 == null
              ? "средняя за минуту"
              : `5 мин ${host.load5.toFixed(2)} · 15 мин ${host.load15?.toFixed(2) ?? "—"}`
          }
          icon={"gauge"}
        />
      </Row>
      <Row gap={12}>
        <StatCard
          label={"Сеть"}
          value={
            host?.netRxBps == null ? "—" : `↓ ${formatRate(host.netRxBps)}`
          }
          hint={
            host?.netTxBps == null
              ? undefined
              : `↑ ${formatRate(host.netTxBps)}`
          }
          icon={"network"}
        />
        <StatCard
          label={"Ждут отправки"}
          value={formatCount(outbox)}
          hint={"важные сообщения агента"}
          icon={"activity"}
          tone={(outbox ?? 0) > 0 ? "warning" : undefined}
        />
      </Row>
    </Col>
  );
};
