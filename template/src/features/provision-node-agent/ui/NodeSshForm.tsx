import {
  Button,
  Col,
  Form,
  Notice,
  NumberFieldFormField,
  Row,
  SegmentedFormField,
  SwitchFormField,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useState } from "react";
import { useWatch } from "react-hook-form";

import type { ProvisionNodeAgentVM } from "../model/useProvisionNodeAgentVM";
import { SSH_AUTH_OPTIONS, type TSshForm } from "../model/validation";
import { WorkersField } from "./WorkersField";

interface INodeSshFormProps {
  vm: ProvisionNodeAgentVM;
}

/** Вход по SSH: адрес, пользователь, пароль или ключ, sudo и параметры. */
export const NodeSshForm: FC<INodeSshFormProps> = observer(({ vm }) => {
  const [more, setMore] = useState(false);
  const auth = useWatch({ control: vm.sshForm.control, name: "auth" });
  const username = useWatch({ control: vm.sshForm.control, name: "username" });
  const uninstall = vm.mode === "uninstall";

  return (
    <Form form={vm.sshForm} onSubmit={vm.submitSsh}>
      <Col gap={12}>
        <Row gap={8}>
          <Col flex={1}>
            <TextFieldFormField<TSshForm>
              name={"host"}
              label={"Адрес SSH"}
              placeholder={vm.node?.host ?? "203.0.113.10"}
              description={"Пусто — адрес узла"}
              autoCapitalize={"none"}
              autoCorrect={false}
            />
          </Col>
          <Col width={96}>
            <NumberFieldFormField<TSshForm> name={"port"} label={"Порт"} />
          </Col>
        </Row>
        <TextFieldFormField<TSshForm>
          name={"username"}
          label={"Пользователь"}
          autoCapitalize={"none"}
          autoCorrect={false}
        />
        <SegmentedFormField<TSshForm>
          name={"auth"}
          label={"Вход"}
          options={SSH_AUTH_OPTIONS}
        />
        {auth === "key" ? (
          <>
            <TextFieldFormField<TSshForm>
              name={"privateKey"}
              label={"Приватный ключ (PEM)"}
              placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----"}
              multiline
              autoCapitalize={"none"}
              autoCorrect={false}
            />
            <TextFieldFormField<TSshForm>
              name={"passphrase"}
              label={"Пароль ключа"}
              description={"Если ключ защищён паролем"}
              secureTextEntry
              autoCapitalize={"none"}
            />
          </>
        ) : (
          <TextFieldFormField<TSshForm>
            name={"password"}
            label={"Пароль"}
            description={"Он же — для sudo, если sudo спрашивает пароль"}
            secureTextEntry
            autoCapitalize={"none"}
          />
        )}
        {username !== "root" && (
          <SwitchFormField<TSshForm>
            name={"sudo"}
            label={"Через sudo"}
            description={"Пользователю не root нужны права администратора"}
          />
        )}
        {uninstall && (
          <SwitchFormField<TSshForm>
            name={"purge"}
            label={"Удалить всё"}
            description={
              "Вместе с программой — данные, настройки, пакеты и пользователя службы"
            }
          />
        )}
        {!uninstall && (
          <WorkersField<TSshForm>
            name={"workers"}
            workers={vm.releaseWorkers}
          />
        )}
        <Button
          title={more ? "Скрыть дополнительное" : "Дополнительно"}
          appearance={"ghost"}
          size={"small"}
          alignSelf={"flex-start"}
          onPress={() => setMore(value => !value)}
        />
        {more && (
          <TextFieldFormField<TSshForm>
            name={"backendUrl"}
            label={"Адрес сервера для узла"}
            placeholder={"https://api.example.com"}
            description={"Пусто — публичный адрес из настроек сервера"}
            keyboardType={"url"}
            autoCapitalize={"none"}
            autoCorrect={false}
          />
        )}
        <Notice
          variant={"info"}
          description={
            "Данные для входа используются один раз и в открытом виде не хранятся."
          }
        />
      </Col>
    </Form>
  );
});
