import { Field, Icon, TextField } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { DemoScreen, DemoSection } from "./DemoScreen";

export const InputsTab: FC = memo(() => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");

  return (
    <DemoScreen>
      <DemoSection
        title={"TextField"}
        description={"label, clearable, hint, счётчик символов"}
      >
        <TextField
          label={"Имя"}
          value={name}
          onChangeText={setName}
          clearable
          hint={"Как к вам обращаться"}
        />
        <TextField
          label={"Пароль"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextField
          label={"Телефон"}
          value={phone}
          keyboardType={"phone-pad"}
          type={"cel-phone"}
          options={{ maskType: "BRL", withDDD: true, dddMask: "+7 (999) " }}
          onChangeText={setPhone}
        />
        <TextField
          label={"Комментарий"}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={120}
          showSymbolCount
        />
        <TextField label={"С ошибкой"} error={"Обязательное поле"} />
        <TextField
          label={"Заблокировано"}
          value={"read only"}
          editable={false}
        />
      </DemoSection>

      <DemoSection
        title={"Field"}
        description={
          "Compound-обёртка: label/description/error-слоты вокруг произвольного контента"
        }
      >
        <Field label={"Со слотами"} description={"Описание под контентом"}>
          <Icon name={"document"} mr={8} />
          <Field.Label color={"textLink"} />
          <TextField placeholder={"Контент поля"} />
        </Field>
        <Field label={"C ошибкой"} error={"Что-то пошло не так"}>
          <TextField placeholder={"Введите значение"} />
        </Field>
      </DemoSection>
    </DemoScreen>
  );
});
