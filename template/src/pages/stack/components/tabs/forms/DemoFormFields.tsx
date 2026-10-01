import {
  AutocompleteFormField,
  DateFormField,
  MultiSelectFormField,
  NumberFieldFormField,
  SegmentedFormField,
  SelectFormField,
  SwitchFormField,
  TextFieldFormField,
} from "@shared/ui";
import { startOfToday } from "date-fns";
import React, { FC, memo, useMemo } from "react";
import { useWatch } from "react-hook-form";

import {
  CITY_OPTIONS,
  PLAN_OPTIONS,
  ROLE_OPTIONS,
  TDemoForm,
} from "./demo-form-schema";
import { DOMAIN_OPTIONS, TAG_OPTIONS } from "./select-demo-api";

/** Поля демо-формы; control берётся из ближайшей `Form`. */
export const DemoFormFields: FC = memo(() => {
  const today = useMemo(() => startOfToday(), []);
  const email = useWatch<TDemoForm, "email">({ name: "email" }) ?? "";
  const emailOptions = useMemo(() => {
    const [name, domain = ""] = email.split("@");

    if (!name || !email.includes("@")) return [];

    return DOMAIN_OPTIONS.filter(option =>
      option.value.startsWith(domain.toLowerCase()),
    ).map(option => ({
      value: `${name}@${option.value}`,
      label: `${name}@${option.value}`,
    }));
  }, [email]);

  return (
    <>
      <TextFieldFormField<TDemoForm> name={"name"} label={"Название"} />
      <SegmentedFormField<TDemoForm, "plan", "free" | "pro" | "team">
        name={"plan"}
        label={"Тариф"}
        options={PLAN_OPTIONS}
      />
      <SelectFormField<TDemoForm>
        name={"role"}
        label={"Роль"}
        options={ROLE_OPTIONS}
        clearable={false}
      />
      <SelectFormField<TDemoForm>
        name={"city"}
        label={"Город"}
        placeholder={"Любой"}
        description={"Необязательно; поиск по 25 вариантам"}
        options={CITY_OPTIONS}
        search
      />
      <MultiSelectFormField<TDemoForm>
        name={"tags"}
        label={"Теги"}
        options={TAG_OPTIONS}
        maxTagCount={3}
        clearable
      />
      <AutocompleteFormField<TDemoForm>
        name={"email"}
        label={"Email"}
        placeholder={"name@domain"}
        options={emailOptions}
        inputProps={{ keyboardType: "email-address", autoCapitalize: "none" }}
      />
      <NumberFieldFormField<TDemoForm, "seats">
        name={"seats"}
        label={"Число мест"}
        placeholder={"1–100"}
      />
      <DateFormField<TDemoForm, "expiresAt">
        name={"expiresAt"}
        label={"Действует до"}
        placeholder={"Бессрочно"}
        description={"Необязательно; не раньше сегодняшнего дня"}
        minDate={today}
      />
      <SwitchFormField<TDemoForm, "notify">
        name={"notify"}
        label={"Уведомления"}
        description={"Письмо о скором окончании срока"}
      />
    </>
  );
});
