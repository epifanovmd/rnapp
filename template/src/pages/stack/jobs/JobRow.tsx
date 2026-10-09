import { isJobActive, JOB_STATUS_LABEL } from "@entities/job";
import type { JobRunDto } from "@shared/api/gen/main/model";
import { formatter } from "@shared/lib/utils";
import { Button, Col, ProgressBar, Row, Text } from "@shared/ui";
import React, { FC, memo } from "react";
import { Linking } from "react-native";

export interface IJobRowProps {
  job: JobRunDto;
  onCancel: (id: string) => void;
}

/** Карточка задачи: статус, прогресс, последняя строка лога, файлы итога, отмена. */
export const JobRow: FC<IJobRowProps> = memo(({ job, onCancel }) => {
  const active = isJobActive(job.status);
  const lastLog = job.progressText ?? job.logTail[job.logTail.length - 1];

  return (
    <Col bg={"surface"} radius={12} pa={12} gap={8}>
      <Row gap={8} alignItems={"center"}>
        <Col flex={1}>
          <Text textStyle={"Body_M1"} numberOfLines={1}>
            {job.title}
          </Text>
          <Text textStyle={"Caption_M1"} color={"textSecondary"}>
            {[
              JOB_STATUS_LABEL[job.status],
              job.jobType ?? job.queue,
              formatter.date.format(job.createdAt),
            ].join(" · ")}
          </Text>
        </Col>
        {active && (
          <Button
            size={"small"}
            variant={"danger"}
            appearance={"ghost"}
            disabled={job.cancelRequested}
            onPress={() => onCancel(job.id)}
          >
            {job.cancelRequested ? "Отменяется" : "Отменить"}
          </Button>
        )}
      </Row>

      {active && <ProgressBar progress={job.progress} />}

      {!!lastLog && (
        <Text textStyle={"Caption_M1"} color={"textTertiary"} numberOfLines={2}>
          {lastLog}
        </Text>
      )}
      {job.outputs?.map(output => (
        <Button
          key={output.name}
          size={"small"}
          appearance={"ghost"}
          onPress={() => Linking.openURL(output.url)}
        >
          {output.size === undefined
            ? output.name
            : `${output.name} · ${formatter.bytes(output.size)}`}
        </Button>
      ))}
      {!!job.error && (
        <Text textStyle={"Caption_M1"} color={"danger"}>
          {job.error.message}
        </Text>
      )}
    </Col>
  );
});
