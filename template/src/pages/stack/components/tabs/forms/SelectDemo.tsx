import { Select, Text } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { CITY_OPTIONS, ROLE_OPTIONS } from "./demo-form-schema";

/** Варианты Select: обычный, clearable, searchable, loading, error, disabled. */
export const SelectDemo: FC = memo(() => {
  const [role, setRole] = useState<string | null>("operator");
  const [optionalRole, setOptionalRole] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [errorValue, setErrorValue] = useState<string | null>(null);

  return (
    <>
      <Select
        label={"Роль"}
        options={ROLE_OPTIONS}
        value={role}
        onChange={setRole}
      />
      <Select
        label={"Роль (clearable)"}
        description={"Пункт «Не выбрано» сбрасывает в null"}
        options={ROLE_OPTIONS}
        value={optionalRole}
        onChange={setOptionalRole}
        clearable
      />
      <Select
        label={"Город"}
        title={"Выберите город"}
        placeholder={"Любой"}
        options={CITY_OPTIONS}
        value={city}
        onChange={setCity}
        searchable
        clearable
      />
      <Text color={"textSecondary"} textStyle={"Caption_M3"}>
        {`Город: ${city ?? "не выбран"}`}
      </Text>
      <Select label={"Загрузка"} options={[]} value={null} loading />
      <Select
        label={"С ошибкой"}
        options={ROLE_OPTIONS}
        value={errorValue}
        onChange={setErrorValue}
        error={errorValue ? undefined : "Обязательное поле"}
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
