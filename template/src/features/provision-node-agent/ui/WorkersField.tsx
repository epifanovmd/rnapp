import { MultiSelectFormField } from "@shared/ui";
import React from "react";
import type { FieldPathByValue, FieldValues } from "react-hook-form";

interface IWorkersFieldProps<TForm extends FieldValues> {
  name: FieldPathByValue<TForm, string[] | undefined>;
  /** Воркеры с сервера. */
  workers: string[];
}

/** Воркеры с сервера для установки вместе с агентом; по умолчанию — все. */
export const WorkersField = <TForm extends FieldValues>({
  name,
  workers,
}: IWorkersFieldProps<TForm>) => (
  <MultiSelectFormField<TForm>
    name={name}
    label={"Воркеры"}
    description={
      workers.length
        ? "Со сборками с сервера; ничего не выбрано — только проверка сети (netprobe)"
        : "На сервере воркеров нет — только проверка сети (netprobe)"
    }
    options={workers.map(worker => ({ value: worker, label: worker }))}
    disabled={workers.length === 0}
    clearable
  />
);
