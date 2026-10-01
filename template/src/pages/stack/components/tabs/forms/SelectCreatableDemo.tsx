import { Select, SelectOption } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { TAG_OPTIONS } from "./select-demo-api";

/** creatable: пункт «Создать «запрос»», onCreate добавляет опцию (асинхронно). */
export const SelectCreatableDemo: FC = memo(() => {
  const [options, setOptions] = useState<SelectOption[]>(TAG_OPTIONS);
  const [value, setValue] = useState<string[]>([]);
  const [single, setSingle] = useState<string | null>(null);

  const create = async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const option = { value: query.toLowerCase(), label: query };

    setOptions(prev => [...prev, option]);

    return option.value;
  };

  return (
    <>
      <Select
        multi
        clearable
        search
        creatable
        label={"Теги (creatable)"}
        description={"Введите новое значение и нажмите «Создать»"}
        options={options}
        value={value}
        onChange={setValue}
        onCreate={create}
      />
      <Select
        clearable
        search
        creatable
        label={"Single (createLabel)"}
        options={options}
        value={single}
        onChange={setSingle}
        onCreate={create}
        createLabel={query => `+ Добавить тег «${query}»`}
      />
    </>
  );
});
