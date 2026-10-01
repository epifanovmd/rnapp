import React from "react";

import type { SelectValue } from "../types";
import type { OptionRow } from "../utils";
import type { ISelectListModel } from "./select-list-model";
import { SelectActionRow } from "./SelectActionRow";
import { SelectGroupHeader } from "./SelectGroupHeader";
import { SelectOptionRow } from "./SelectOptionRow";

export interface ISelectListRowProps<V extends SelectValue> {
  row: OptionRow<V>;
  model: ISelectListModel<V>;
}

/** Строка списка по её виду: опция, группа, «Не выбрано», «Создать». */
export const SelectListRow = <V extends SelectValue>({
  row,
  model,
}: ISelectListRowProps<V>) => {
  switch (row.kind) {
    case "clear":
      return (
        <SelectActionRow
          muted
          active={model.clearActive}
          onPress={model.onClear}
        >
          {model.clearLabel}
        </SelectActionRow>
      );
    case "create":
      return (
        <SelectActionRow icon={"plus"} onPress={model.onCreate}>
          {model.createContent}
        </SelectActionRow>
      );
    case "group":
      return <SelectGroupHeader label={row.label} />;
    case "option": {
      const { option, index } = row;
      const selected = model.isSelected(option.value);
      const disabled = !!option.disabled;

      return (
        <SelectOptionRow
          content={
            model.optionRender
              ? model.optionRender({ option, index, selected, disabled })
              : option.label
          }
          description={option.description}
          selected={selected}
          disabled={disabled}
          multi={model.multi}
          onPress={() => model.onSelect(option.value)}
        />
      );
    }
  }
};
