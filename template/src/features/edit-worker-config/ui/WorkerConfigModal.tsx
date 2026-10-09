import { ConfigStateTag, SchemaHint } from "@entities/agent";
import {
  Col,
  Form,
  ModalSheet,
  Notice,
  Row,
  Text,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import type { WorkerConfigEditorVM } from "../model/useWorkerConfigEditorVM";
import type { TWorkerConfigForm } from "../model/validation";

interface IWorkerConfigModalProps {
  vm: WorkerConfigEditorVM;
}

/**
 * Ключ настроек воркера: подсказка по схеме, статус применения и
 * JSON-значение. Открывается только с правом на настройки: без него сервер
 * значения не отдаёт.
 */
export const WorkerConfigModal: FC<IWorkerConfigModalProps> = observer(
  ({ vm }) => {
    const { target } = vm;
    const status = target?.entry?.status;

    return (
      <ModalSheet
        open={vm.open}
        onOpenChange={next => !next && vm.close()}
        onClosed={vm.onClosed}
        title={target ? `${target.worker} / ${target.key}` : ""}
        description={
          target?.manifest?.description ?? "Настройка воркера — любой JSON"
        }
        cancelLabel={"Отмена"}
        primaryAction={{
          title: "Задать новую версию",
          onPress: vm.form.handleSubmit(vm.save),
          loading: vm.form.formState.isSubmitting,
        }}
      >
        {!!target && (
          <Col gap={12}>
            {!target.manifest && (
              <Notice
                variant={"warning"}
                description={
                  "Этого ключа нет в манифесте воркера: агент не передаст его воркеру."
                }
              />
            )}
            <SchemaHint schema={target.manifest?.schema} />
            {!!status && (
              <Row wrap alignItems={"center"} gap={6}>
                <Text textStyle={"Body_S2"} color={"textSecondary"}>
                  {`Сейчас — версия ${status.version ?? "—"}`}
                </Text>
                <ConfigStateTag state={status.state} />
              </Row>
            )}
            {!!status?.error && (
              <Text textStyle={"Caption_M3"} color={"danger"}>
                {status.error.message}
              </Text>
            )}
            <Form form={vm.form} onSubmit={vm.save}>
              <TextFieldFormField<TWorkerConfigForm>
                name={"value"}
                label={"Значение (JSON)"}
                description={
                  "Сервер проверит его по схеме и даст новую версию; агент применит её сразу или при подключении"
                }
                multiline
                autoCapitalize={"none"}
                autoCorrect={false}
                numberOfLines={10}
              />
            </Form>
          </Col>
        )}
      </ModalSheet>
    );
  },
);
