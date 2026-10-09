import {
  Col,
  CopyableText,
  Divider,
  ModalSheet,
  Notice,
  Text,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, ReactNode } from "react";

import type { EnrollAgentVM } from "../model/useEnrollAgentVM";
import { EnrollmentTokenForm } from "./EnrollmentTokenForm";
import { EnrollmentTokenList } from "./EnrollmentTokenList";
import { InstallCommandForm } from "./InstallCommandForm";

interface IInstallAgentModalProps {
  vm: EnrollAgentVM;
}

const Step: FC<{ title: string; hint: string; children: ReactNode }> = ({
  title,
  hint,
  children,
}) => (
  <Col gap={12}>
    <Col gap={4}>
      <Text textStyle={"Title_S1"}>{title}</Text>
      <Text textStyle={"Body_S2"} color={"textSecondary"}>
        {hint}
      </Text>
    </Col>
    {children}
  </Col>
);

/**
 * Установка агента в два шага: токен регистрации и команда для узла. Агент
 * сам регистрируется по токену и выходит на связь.
 */
export const InstallAgentModal: FC<IInstallAgentModalProps> = observer(
  ({ vm }) => (
    <ModalSheet
      open={vm.open}
      onOpenChange={vm.setOpen}
      onClosed={vm.onClosed}
      title={"Установить агента"}
      description={
        "Агент регистрируется по токену и сам выходит на связь с сервером"
      }
      cancelLabel={null}
      primaryAction={{ title: "Готово", onPress: () => vm.setOpen(false) }}
    >
      <Col gap={20}>
        <Step
          title={"1. Токен регистрации"}
          hint={
            "По токену агент получает свой ключ. Одноразовый токен с коротким сроком безопаснее."
          }
        >
          <EnrollmentTokenForm vm={vm} />
          {!!vm.issued && (
            <Col gap={8}>
              <Notice
                variant={"warning"}
                description={
                  "Скопируйте токен сейчас — повторно он не показывается. Он уже подставлен в команду ниже."
                }
              />
              <Col bg={"onSurface"} radius={12} pa={12}>
                <CopyableText text={vm.issued} mono numberOfLines={0} />
              </Col>
            </Col>
          )}
          <EnrollmentTokenList vm={vm} />
        </Step>
        <Divider />
        <Step
          title={"2. Команда установки"}
          hint={
            "Выполните её на узле: установщик скачает агента с сервера, проверит подпись и запустит службу."
          }
        >
          <InstallCommandForm vm={vm} />
          {!!vm.command && (
            <Col bg={"onSurface"} radius={12} pa={12}>
              <CopyableText text={vm.command} mono numberOfLines={0} />
            </Col>
          )}
        </Step>
      </Col>
    </ModalSheet>
  ),
);
