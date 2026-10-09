import type {
  ENodeStatus,
  INodeJobDto,
  JobRunDto,
} from "@shared/api/gen/main/model";
import { useNavigation } from "@shared/lib/navigation";
import { Button, Col, Notice, ProgressBar, Text } from "@shared/ui";
import React, { FC } from "react";
import { Platform, StyleSheet } from "react-native";

import { provisionBanner } from "../model/provision-banner";

interface IProvisionJobBannerProps {
  /** Последняя задача узла из сводки узла. */
  job: INodeJobDto | null;
  /** Та же задача целиком (с журналом), если загружена. */
  run: JobRunDto | null;
  nodeStatus: ENodeStatus;
  agentOnline: boolean;
}

const TITLE = {
  install: {
    active: "Установка агента",
    failed: "Установка агента не удалась",
  },
  uninstall: {
    active: "Удаление агента",
    failed: "Удаление агента не удалось",
  },
};

/** Ход установки или удаления агента на экране узла (обновления — по сокету). */
export const ProvisionJobBanner: FC<IProvisionJobBannerProps> = ({
  job,
  run,
  nodeStatus,
  agentOnline,
}) => {
  const navigation = useNavigation();
  const banner = provisionBanner(job, run, nodeStatus, agentOnline);

  if (!banner) return null;

  const jobsAction = (
    <Button
      title={"Все задачи"}
      appearance={"ghost"}
      size={"small"}
      onPress={() => navigation.navigate("Jobs")}
    />
  );

  if (banner.kind === "installed") {
    return (
      <Notice
        variant={"info"}
        title={"Агент установлен"}
        description={"Служба агента запущена, ждём выхода агента на связь."}
      />
    );
  }

  const title = banner.uninstall ? TITLE.uninstall : TITLE.install;

  if (banner.kind === "active") {
    return (
      <Notice
        variant={"info"}
        title={title.active}
        description={
          <Col gap={8}>
            <ProgressBar progress={banner.progress} />
            <Text textStyle={"Body_S2"}>{banner.text ?? "В очереди"}</Text>
          </Col>
        }
        action={jobsAction}
      />
    );
  }

  return (
    <Notice
      variant={"danger"}
      title={title.failed}
      description={
        <Col gap={8}>
          <Text textStyle={"Body_S2"}>{banner.message}</Text>
          {banner.logTail.length > 0 && (
            <Col bg={"onSurface"} radius={8} pa={8}>
              <Text textStyle={"Caption_M3"} style={styles.mono}>
                {banner.logTail.join("\n")}
              </Text>
            </Col>
          )}
        </Col>
      }
      action={jobsAction}
    />
  );
};

const styles = StyleSheet.create({
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
