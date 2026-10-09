import {
  Button,
  Col,
  Form,
  SegmentedFormField,
  SwitchFormField,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import type { EnrollAgentVM } from "../model/useEnrollAgentVM";
import {
  type TEnrollmentTokenForm,
  TOKEN_EXPIRY_OPTIONS,
} from "../model/validation";

interface IEnrollmentTokenFormProps {
  vm: EnrollAgentVM;
}

const EXPIRY_OPTIONS = TOKEN_EXPIRY_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

/** Создание токена регистрации: название, срок, одноразовость, метки. */
export const EnrollmentTokenForm: FC<IEnrollmentTokenFormProps> = observer(
  ({ vm }) => (
    <Form form={vm.tokenForm} onSubmit={vm.createToken}>
      <Col gap={12}>
        <TextFieldFormField<TEnrollmentTokenForm>
          name={"name"}
          label={"Название"}
          placeholder={"Например: узлы в зоне eu"}
        />
        <SegmentedFormField<TEnrollmentTokenForm>
          name={"expiry"}
          label={"Срок действия"}
          options={EXPIRY_OPTIONS}
          scrollable
        />
        <SwitchFormField<TEnrollmentTokenForm>
          name={"singleUse"}
          label={"Одноразовый"}
          description={"Зарегистрировать по нему можно только одного агента"}
        />
        <TextFieldFormField<TEnrollmentTokenForm>
          name={"labels"}
          label={"Метки агентов"}
          description={
            "ключ=значение через запятую — их получат все агенты с этим токеном"
          }
          placeholder={"zone=eu, gpu=true"}
          autoCapitalize={"none"}
          autoCorrect={false}
        />
        <Button
          title={"Создать токен"}
          variant={"secondary"}
          appearance={"outline"}
          size={"small"}
          leftIcon={"key"}
          alignSelf={"flex-start"}
          loading={vm.tokenForm.formState.isSubmitting}
          onPress={vm.tokenForm.handleSubmit(vm.createToken)}
        />
      </Col>
    </Form>
  ),
);
