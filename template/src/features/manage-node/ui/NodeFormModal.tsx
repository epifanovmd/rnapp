import { Col, Form, ModalSheet, TextFieldFormField } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import type { NodeFormVM } from "../model/useNodeFormVM";
import type { TNodeForm } from "../model/validation";

interface INodeFormModalProps {
  vm: NodeFormVM;
}

/** Шторка создания и изменения узла; открывается методами VM. */
export const NodeFormModal: FC<INodeFormModalProps> = observer(({ vm }) => (
  <ModalSheet
    open={vm.open}
    onOpenChange={vm.setOpen}
    title={vm.editing ? "Изменение узла" : "Новый узел"}
    description={"Машина, на которой работает агент"}
    cancelLabel={"Отмена"}
    primaryAction={{
      title: vm.editing ? "Сохранить" : "Создать",
      onPress: vm.form.handleSubmit(vm.submit),
      loading: vm.form.formState.isSubmitting,
    }}
  >
    <Form form={vm.form} onSubmit={vm.submit}>
      <Col gap={12}>
        <TextFieldFormField<TNodeForm>
          name={"name"}
          label={"Название"}
          placeholder={"node-01"}
        />
        <TextFieldFormField<TNodeForm>
          name={"host"}
          label={"Адрес"}
          placeholder={"203.0.113.10 или node.example.com"}
          description={
            "Публичный адрес: для входа по SSH и проверки связи между узлами"
          }
          autoCapitalize={"none"}
          autoCorrect={false}
        />
        <TextFieldFormField<TNodeForm>
          name={"description"}
          label={"Описание"}
          multiline
        />
      </Col>
    </Form>
  </ModalSheet>
));
