import {
  NumberFieldFormField,
  SegmentedFormField,
  SelectFormField,
  TextFieldFormField,
} from "@shared/ui";
import React, { FC, memo } from "react";

import {
  CITY_OPTIONS,
  PLAN_OPTIONS,
  ROLE_OPTIONS,
  TDemoForm,
} from "./demo-form-schema";

/** Поля демо-формы; control берётся из ближайшей `Form`. */
export const DemoFormFields: FC = memo(() => (
  <>
    <TextFieldFormField<TDemoForm> name={"name"} label={"Название"} />
    <SegmentedFormField<TDemoForm, "plan", "free" | "pro" | "team">
      name={"plan"}
      label={"Тариф"}
      options={PLAN_OPTIONS}
    />
    <SelectFormField<TDemoForm, "role">
      name={"role"}
      label={"Роль"}
      options={ROLE_OPTIONS}
    />
    <SelectFormField<TDemoForm, "city">
      name={"city"}
      label={"Город"}
      placeholder={"Любой"}
      description={"Необязательно; поиск по 25 вариантам"}
      options={CITY_OPTIONS}
      clearable
    />
    <NumberFieldFormField<TDemoForm, "seats">
      name={"seats"}
      label={"Число мест"}
      placeholder={"1–100"}
    />
  </>
));
