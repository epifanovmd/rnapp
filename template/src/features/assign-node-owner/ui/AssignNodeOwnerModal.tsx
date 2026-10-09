import { Col, ModalSheet, Notice, Select } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import type { AssignNodeOwnerVM } from "../model/useAssignNodeOwnerVM";

interface IAssignNodeOwnerModalProps {
  vm: AssignNodeOwnerVM;
}

/** Выбор владельца узла; пустой выбор снимает владельца. */
export const AssignNodeOwnerModal: FC<IAssignNodeOwnerModalProps> = observer(
  ({ vm }) => (
    <ModalSheet
      open={vm.open}
      onOpenChange={next => !next && vm.close()}
      title={"Владелец"}
      description={
        vm.node
          ? `Узел ${vm.node.name}: владелец видит и обслуживает его по правам «свои»`
          : undefined
      }
      cancelLabel={"Отмена"}
      primaryAction={{
        title: "Сохранить",
        onPress: vm.save,
        loading: vm.isSaving,
      }}
    >
      <Col gap={12}>
        <Select
          label={"Владелец"}
          placeholder={"не назначен"}
          options={vm.userOptions}
          loading={vm.isLoadingUsers}
          value={vm.userId}
          search
          clearable
          onChange={value => vm.setUserId(value ?? null)}
        />
        {!vm.canListUsers && (
          <Notice
            variant={"info"}
            description={
              "Нет права на список пользователей: можно назначить себя или снять владельца."
            }
          />
        )}
      </Col>
    </ModalSheet>
  ),
);
