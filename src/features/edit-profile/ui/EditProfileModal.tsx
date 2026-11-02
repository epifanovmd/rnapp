import {
  Col,
  DateFormField,
  Form,
  ModalSheet,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useMemo } from "react";

import { useEditProfileVM } from "../model/useEditProfileVM";
import { TProfileForm } from "../model/validation";

interface IEditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

/** Редактирование личных данных профиля в шторке. */
export const EditProfileModal: FC<IEditProfileModalProps> = observer(
  ({ open, onClose }) => {
    const { form, submit, onClosed } = useEditProfileVM({
      open,
      onSuccess: onClose,
    });
    const today = useMemo(() => new Date(), []);

    return (
      <ModalSheet
        open={open}
        onOpenChange={isOpen => !isOpen && onClose()}
        onClosed={onClosed}
        title={"Редактирование профиля"}
        description={"Пустое поле очищает значение в профиле"}
        primaryAction={{
          title: "Сохранить",
          loading: form.formState.isSubmitting,
          onPress: form.handleSubmit(submit),
        }}
      >
        <Form form={form} onSubmit={submit}>
          <Col gap={8}>
            <TextFieldFormField<TProfileForm>
              name={"firstName"}
              label={"Имя"}
              placeholder={"Иван"}
              autoComplete={"given-name"}
              textContentType={"givenName"}
            />
            <TextFieldFormField<TProfileForm>
              name={"lastName"}
              label={"Фамилия"}
              placeholder={"Иванов"}
              autoComplete={"family-name"}
              textContentType={"familyName"}
            />
            <TextFieldFormField<TProfileForm>
              name={"gender"}
              label={"Пол"}
              placeholder={"Мужской / Женский"}
            />
            <DateFormField<TProfileForm>
              name={"birthDate"}
              label={"Дата рождения"}
              placeholder={"Выберите дату"}
              maxDate={today}
            />
            <TextFieldFormField<TProfileForm>
              name={"locale"}
              label={"Язык (ru, en)"}
              placeholder={"ru"}
              autoCapitalize={"none"}
              autoCorrect={false}
            />
          </Col>
        </Form>
      </ModalSheet>
    );
  },
);
