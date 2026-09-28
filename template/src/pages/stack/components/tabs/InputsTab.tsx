import { Field, Icon, Row, Text, TextField } from "@shared/ui";
import React, { FC, memo, useState } from "react";
import { StyleSheet } from "react-native";

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
        title={"TextField: контент по краям"}
        description={"iconName и произвольные left/right-слоты"}
      >
        <TextField label={"Поиск"} iconName={"search"} clearable />
        <TextField
          label={"Сумма"}
          keyboardType={"numeric"}
          right={
            <Text color={"textTertiary"} textStyle={"Body_M2"}>
              ₽
            </Text>
          }
        />
      </DemoSection>

      <DemoSection
        title={"Field"}
        description={
          "Обёртка label/description/error вокруг произвольного контента; " +
          "раскладку контента задаёт вызывающий"
        }
      >
        <Field label={"Со слотами"} description={"Описание под контентом"}>
          <Field.Label color={"textLink"} />
          <Row alignItems={"center"} gap={8}>
            <Icon name={"document"} />
            <TextField style={styles.grow} placeholder={"Контент поля"} />
          </Row>
        </Field>
        <Field label={"C ошибкой"} error={"Что-то пошло не так"}>
          <TextField placeholder={"Введите значение"} />
        </Field>
      </DemoSection>
    </DemoScreen>
  );
});

const styles = StyleSheet.create({
  grow: {
    flex: 1,
  },
});
