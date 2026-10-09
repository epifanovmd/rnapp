import { useNavigation } from "@shared/lib/navigation";
import {
  Col,
  ModalSheet,
  Notice,
  Segmented,
  type SegmentedOption,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import type {
  ProvisionNodeAgentVM,
  TInstallWay,
} from "../model/useProvisionNodeAgentVM";
import { InstallCommandPanel } from "./InstallCommandPanel";
import { NodeSshForm } from "./NodeSshForm";

interface IProvisionNodeAgentModalProps {
  vm: ProvisionNodeAgentVM;
}

const WAY_OPTIONS: SegmentedOption<TInstallWay>[] = [
  { value: "command", label: "Команда" },
  { value: "ssh", label: "По SSH" },
];

const TEXT = {
  install: {
    title: "Установка агента",
    description: "Командой на узле или сервером по SSH",
    submit: "Установить",
    started:
      "Установка запущена. Узел выйдет на связь сам, как только агент запустится; ход — на экране узла.",
  },
  uninstall: {
    title: "Удаление агента",
    description:
      "Сервер войдёт на узел по SSH, остановит службу и удалит программу агента",
    submit: "Удалить агента",
    started:
      "Удаление запущено. После него агент будет отозван, узел останется без агента.",
  },
} as const;

/** Установка или удаление агента узла; открывается методами VM. */
export const ProvisionNodeAgentModal: FC<IProvisionNodeAgentModalProps> =
  observer(({ vm }) => {
    const navigation = useNavigation();
    const text = TEXT[vm.mode];
    const ssh = vm.mode === "uninstall" || vm.way === "ssh";

    const openJobs = () => {
      vm.close();
      navigation.navigate("Jobs");
    };

    const primaryAction = vm.jobId
      ? { title: "К задачам", onPress: openJobs }
      : ssh
        ? {
            title: text.submit,
            onPress: vm.sshForm.handleSubmit(vm.submitSsh),
            loading: vm.sshForm.formState.isSubmitting,
            variant: vm.mode === "uninstall" ? ("danger" as const) : undefined,
          }
        : {
            title: vm.command ? "Получить новую команду" : "Получить команду",
            onPress: vm.commandForm.handleSubmit(vm.createCommand),
            loading: vm.commandForm.formState.isSubmitting,
          };

    return (
      <ModalSheet
        open={vm.open}
        onOpenChange={next => !next && vm.close()}
        onClosed={vm.onClosed}
        title={`${text.title}: ${vm.node?.name ?? ""}`}
        description={text.description}
        cancelLabel={vm.jobId || vm.command ? "Закрыть" : "Отмена"}
        primaryAction={primaryAction}
      >
        {vm.jobId ? (
          <Notice variant={"success"} description={text.started} />
        ) : (
          <Col gap={12}>
            {vm.mode === "install" && (
              <Segmented
                options={WAY_OPTIONS}
                value={vm.way}
                onValueChange={vm.setWay}
              />
            )}
            {ssh ? <NodeSshForm vm={vm} /> : <InstallCommandPanel vm={vm} />}
          </Col>
        )}
      </ModalSheet>
    );
  });
