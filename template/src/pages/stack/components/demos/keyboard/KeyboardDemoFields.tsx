import { Section, TextFieldFormField } from "@shared/ui";
import React, { FC, memo } from "react";

import { TKeyboardDemoForm } from "./keyboard-demo-schema";

/** Поля длинной формы; control берётся из ближайшей `Form`. */
export const KeyboardDemoFields: FC = memo(() => (
  <>
    <Section title={"Профиль"} gap={12}>
      <TextFieldFormField<TKeyboardDemoForm>
        name={"firstName"}
        label={"Имя"}
        autoComplete={"given-name"}
      />
      <TextFieldFormField<TKeyboardDemoForm>
        name={"lastName"}
        label={"Фамилия"}
        autoComplete={"family-name"}
      />
      <TextFieldFormField<TKeyboardDemoForm>
        name={"email"}
        label={"Email"}
        description={"На него придёт подтверждение заказа"}
        keyboardType={"email-address"}
        autoCapitalize={"none"}
      />
      <TextFieldFormField<TKeyboardDemoForm>
        name={"phone"}
        label={"Телефон"}
        description={"Курьер позвонит перед доставкой"}
        keyboardType={"phone-pad"}
      />
      <TextFieldFormField<TKeyboardDemoForm>
        name={"company"}
        label={"Компания"}
        description={"Необязательно"}
      />
    </Section>
    <Section title={"Адрес"} gap={12}>
      <TextFieldFormField<TKeyboardDemoForm> name={"city"} label={"Город"} />
      <TextFieldFormField<TKeyboardDemoForm> name={"street"} label={"Улица"} />
      <TextFieldFormField<TKeyboardDemoForm> name={"house"} label={"Дом"} />
      <TextFieldFormField<TKeyboardDemoForm>
        name={"apartment"}
        label={"Квартира"}
        description={"Необязательно"}
      />
      <TextFieldFormField<TKeyboardDemoForm>
        name={"postalCode"}
        label={"Индекс"}
        keyboardType={"number-pad"}
        maxLength={6}
      />
    </Section>
    <Section title={"Заказ"} gap={12}>
      <TextFieldFormField<TKeyboardDemoForm>
        name={"orderNumber"}
        label={"Номер заказа"}
        description={"Формат: AB-1234"}
        autoCapitalize={"characters"}
      />
      <TextFieldFormField<TKeyboardDemoForm>
        name={"comment"}
        label={"Комментарий курьеру"}
        description={"Многострочное поле: растёт при вводе"}
        multiline
        maxLength={500}
        showSymbolCount
      />
    </Section>
  </>
));
