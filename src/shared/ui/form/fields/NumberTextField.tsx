import React, { useEffect, useState } from "react";

import { ITextFieldProps, TextField } from "../../input";
import { parseNumberInput } from "./parse-number-input";

type TNumberFieldValue = number | null | undefined;

export interface INumberTextFieldProps extends Omit<
  ITextFieldProps,
  "value" | "onChangeText"
> {
  value: TNumberFieldValue;
  allowDecimal?: boolean;
  onValueChange: (value: number | null) => void;
}

/** Текст поля живёт локально: промежуточный ввод («-») не теряется. */
export const NumberTextField = ({
  value,
  allowDecimal,
  onValueChange,
  ...props
}: INumberTextFieldProps) => {
  const [text, setText] = useState(value == null ? "" : String(value));

  useEffect(() => {
    setText(current =>
      parseNumberInput(current, allowDecimal) === (value ?? null)
        ? current
        : value == null
          ? ""
          : String(value),
    );
  }, [value, allowDecimal]);

  return (
    <TextField
      {...props}
      value={text}
      keyboardType={allowDecimal ? "decimal-pad" : "number-pad"}
      onChangeText={next => {
        setText(next);
        const parsed = parseNumberInput(next, allowDecimal);

        if (parsed !== undefined) onValueChange(parsed);
      }}
    />
  );
};
