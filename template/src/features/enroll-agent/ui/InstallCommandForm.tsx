import {
  Button,
  Col,
  Form,
  MultiSelectFormField,
  SegmentedFormField,
  SwitchFormField,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useState } from "react";

import type { EnrollAgentVM } from "../model/useEnrollAgentVM";
import {
  KILL_MODE_OPTIONS,
  type TInstallCommandForm,
} from "../model/validation";

interface IInstallCommandFormProps {
  vm: EnrollAgentVM;
}

/** Текстовое поле без автозамен: пути, имена, адреса. */
const PLAIN = { autoCapitalize: "none", autoCorrect: false } as const;

/** Параметры установки агента на узел: из них сервер собирает команду. */
export const InstallCommandForm: FC<IInstallCommandFormProps> = observer(
  ({ vm }) => {
    const [more, setMore] = useState(false);

    return (
      <Form form={vm.installForm} onSubmit={vm.createCommand}>
        <Col gap={12}>
          <TextFieldFormField<TInstallCommandForm>
            name={"token"}
            label={"Токен регистрации"}
            description={"Подставляется сам после создания токена"}
            placeholder={"prefix.secret"}
            {...PLAIN}
          />
          <TextFieldFormField<TInstallCommandForm>
            name={"name"}
            label={"Имя агента"}
            description={"Без него — имя узла"}
            placeholder={"node-01"}
            {...PLAIN}
          />
          <TextFieldFormField<TInstallCommandForm>
            name={"user"}
            label={"Пользователь службы"}
            description={"Без него — по умолчанию установщика"}
            placeholder={"agent"}
            {...PLAIN}
          />
          <MultiSelectFormField<TInstallCommandForm>
            name={"workers"}
            label={"Воркеры с сервера"}
            description={
              vm.releaseWorkers.length
                ? "Установятся вместе с агентом"
                : "На сервере воркеров нет"
            }
            options={vm.releaseWorkers.map(name => ({
              value: name,
              label: name,
            }))}
            disabled={vm.releaseWorkers.length === 0}
            clearable
          />
          <SwitchFormField<TInstallCommandForm>
            name={"privileged"}
            label={"Полные права службы"}
            description={
              "Нужны воркерам, которые меняют сеть или настройки узла"
            }
          />
          <Button
            title={more ? "Скрыть дополнительное" : "Дополнительно"}
            appearance={"ghost"}
            size={"small"}
            alignSelf={"flex-start"}
            onPress={() => setMore(value => !value)}
          />
          {more && (
            <Col gap={12}>
              <TextFieldFormField<TInstallCommandForm>
                name={"baseUrl"}
                label={"Адрес сервера"}
                description={"Без него — публичный адрес из настроек сервера"}
                placeholder={"https://example.com"}
                keyboardType={"url"}
                {...PLAIN}
              />
              <TextFieldFormField<TInstallCommandForm>
                name={"tokenFile"}
                label={"Файл с токеном на узле"}
                description={"Вместо токена в команде — путь к файлу"}
                placeholder={"/etc/agent/token"}
                {...PLAIN}
              />
              <TextFieldFormField<TInstallCommandForm>
                name={"config"}
                label={"Путь к agent.yaml"}
                placeholder={"/etc/agent/agent.yaml"}
                {...PLAIN}
              />
              <TextFieldFormField<TInstallCommandForm>
                name={"stopTimeout"}
                label={"Время на остановку"}
                placeholder={"30s"}
                {...PLAIN}
              />
              <SegmentedFormField<TInstallCommandForm>
                name={"killMode"}
                label={"Что останавливать вместе со службой"}
                options={KILL_MODE_OPTIONS}
              />
              <TextFieldFormField<TInstallCommandForm>
                name={"packages"}
                label={"Пакеты"}
                description={"Через запятую или пробел"}
                placeholder={"curl jq"}
                {...PLAIN}
              />
              <TextFieldFormField<TInstallCommandForm>
                name={"rwPaths"}
                label={"Каталоги для записи"}
                description={"Через запятую или пробел"}
                placeholder={"/var/lib/example"}
                {...PLAIN}
              />
              <TextFieldFormField<TInstallCommandForm>
                name={"sysctl"}
                label={"Настройки ядра (sysctl)"}
                description={"ключ=значение через запятую"}
                placeholder={"net.ipv4.ip_forward=1"}
                {...PLAIN}
              />
              <TextFieldFormField<TInstallCommandForm>
                name={"caFile"}
                label={"Сертификат центра (CA) на узле"}
                placeholder={"/etc/ssl/example-ca.pem"}
                {...PLAIN}
              />
              <TextFieldFormField<TInstallCommandForm>
                name={"releases"}
                label={"Источник сборок воркеров"}
                description={"Без него — сборки этого сервера"}
                placeholder={"https://example.com/releases"}
                {...PLAIN}
              />
            </Col>
          )}
          <Button
            title={"Получить команду"}
            size={"small"}
            leftIcon={"terminal"}
            alignSelf={"flex-start"}
            loading={vm.installForm.formState.isSubmitting}
            onPress={vm.installForm.handleSubmit(vm.createCommand)}
          />
        </Col>
      </Form>
    );
  },
);
