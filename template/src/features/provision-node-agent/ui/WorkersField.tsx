import { MultiSelectFormField } from "@shared/ui";
import React from "react";
import type { FieldPathByValue, FieldValues } from "react-hook-form";

interface IWorkersFieldProps<TForm extends FieldValues> {
  name: FieldPathByValue<TForm, string[] | undefined>;
  /** Воркеры из выпуска сервера. */
  workers: string[];
}

/** Воркеры из выпуска для установки вместе с агентом; по умолчанию — все. */
export const WorkersField = <TForm extends FieldValues>({
  name,
  workers,
}: IWorkersFieldProps<TForm>) => (
  <MultiSelectFormField<TForm>
    name={name}
    label={"Воркеры"}
    description={
      workers.length
        ? "Из выпуска сервера; ничего не выбрано — только проверка сети (netprobe)"
        : "В выпуске на сервере воркеров нет — только проверка сети (netprobe)"
    }
    options={workers.map(worker => ({ value: worker, label: worker }))}
    disabled={workers.length === 0}
    clearable
  />
);
