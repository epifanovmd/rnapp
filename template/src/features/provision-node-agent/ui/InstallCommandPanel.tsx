import { formatter } from "@shared/lib/utils";
import {
  Col,
  CopyableText,
  Form,
  Notice,
  NumberFieldFormField,
  Text,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import type { ProvisionNodeAgentVM } from "../model/useProvisionNodeAgentVM";
import type { TInstallCommandForm } from "../model/validation";
import { WorkersField } from "./WorkersField";

interface IInstallCommandPanelProps {
  vm: ProvisionNodeAgentVM;
}

/** Команда установки: выполнить на узле, агент сам привяжется к узлу. */
export const InstallCommandPanel: FC<IInstallCommandPanelProps> = observer(
  ({ vm }) => (
    <Col gap={12}>
      <Text textStyle={"Body_S2"} color={"textSecondary"}>
        {
          "Выполните команду на узле от root: установщик скачает агента с сервера, агент зарегистрируется по одноразовому токену и привяжется к этому узлу."
        }
      </Text>
      <Form form={vm.commandForm} onSubmit={vm.createCommand}>
        <Col gap={12}>
          <NumberFieldFormField<TInstallCommandForm>
            name={"expiresInMinutes"}
            label={"Срок токена, минут"}
          />
          <WorkersField<TInstallCommandForm>
            name={"workers"}
            workers={vm.releaseWorkers}
          />
          <TextFieldFormField<TInstallCommandForm>
            name={"baseUrl"}
            label={"Адрес сервера для узла"}
            placeholder={"https://api.example.com"}
            description={"Пусто — публичный адрес из настроек сервера"}
            keyboardType={"url"}
            autoCapitalize={"none"}
            autoCorrect={false}
          />
        </Col>
      </Form>
      {!!vm.command && (
        <Col gap={8}>
          <Notice
            variant={"warning"}
            description={`Токен в команде одноразовый и показывается только сейчас. Действует до ${formatter.date.format(vm.command.expiresAt)}.`}
          />
          <Col bg={"onSurface"} radius={12} pa={12}>
            <CopyableText text={vm.command.command} mono numberOfLines={0} />
          </Col>
        </Col>
      )}
    </Col>
  ),
);
