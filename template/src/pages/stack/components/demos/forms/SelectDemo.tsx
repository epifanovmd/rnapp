import {
  Avatar,
  LabeledValue,
  Row,
  Select,
  SelectOption,
  Text,
} from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { CITY_OPTIONS, ROLE_OPTIONS } from "./demo-form-schema";

const renderRoleOption = ({
  option,
  selected,
}: {
  option: SelectOption;
  selected: boolean;
}) => (
  <Row gap={12} alignItems={"center"}>
    <Avatar name={String(option.label)} size={32} />
    <Text textStyle={selected ? "Title_S2" : "Body_M2"}>{option.label}</Text>
  </Row>
);

/** Single-режимы: обычный, clearable, labelInValue, поиск, renderValue/optionRender, состояния. */
export const SelectDemo: FC = memo(() => {
  const [role, setRole] = useState<string | null>("operator");
  const [optionalRole, setOptionalRole] = useState<string | null>(null);
  const [city, setCity] = useState<LabeledValue | null>({
    value: "Берлин",
    label: "Берлин",
  });
  const [custom, setCustom] = useState<string | null>("admin");
  const [required, setRequired] = useState<string | null>(null);

  return (
    <>
      <Select
        label={"Роль"}
        options={ROLE_OPTIONS}
        value={role}
        onChange={setRole}
      />
      <Select
        clearable
        label={"Роль (clearable)"}
        description={"Крестик в поле и «Не выбрано» в списке сбрасывают в null"}
        options={ROLE_OPTIONS}
        value={optionalRole}
        onChange={setOptionalRole}
      />
      <Select
        clearable
        labelInValue
        search
        label={"Город (labelInValue + поиск)"}
        title={"Выберите город"}
        placeholder={"Любой"}
        options={CITY_OPTIONS}
        value={city}
        onChange={setCity}
      />
      <Text color={"textSecondary"} textStyle={"Caption_M3"}>
        {`value: ${JSON.stringify(city)}`}
      </Text>
      <Select
        label={"optionRender + renderValue"}
        options={ROLE_OPTIONS}
        value={custom}
        onChange={setCustom}
        optionRender={renderRoleOption}
        renderValue={({ labels }) => `👤 ${labels.join(", ")}`}
      />
      <Select label={"Загрузка"} options={[]} loading />
      <Select
        label={"Ошибка загрузки"}
        options={[]}
        error={new Error("network")}
        errorContent={"Сервер недоступен"}
      />
      <Select
        label={"Валидация"}
        options={ROLE_OPTIONS}
        value={required}
        onChange={setRequired}
        errorMessage={required ? undefined : "Обязательное поле"}
      />
      <Select
        label={"Недоступен"}
        options={ROLE_OPTIONS}
        value={"viewer"}
        disabled
      />
    </>
  );
});
