import React, { memo } from "react";

import { Col, Row } from "../flex-view";
import { Radio } from "./Radio";

export interface IRadioOption<Value> {
  label: string;
  value: Value;
  description?: string;
  disabled?: boolean;
}

export interface IRadioGroupProps<Value> {
  options: IRadioOption<Value>[];
  value?: Value;
  onChange?: (value: Value) => void;
  disabled?: boolean;
  horizontal?: boolean;
  gap?: number;
}

const RadioGroupComponent = <Value,>({
  options,
  value,
  onChange,
  disabled,
  horizontal,
  gap = 12,
}: IRadioGroupProps<Value>) => {
  const Wrapper = horizontal ? Row : Col;

  return (
    <Wrapper gap={gap} accessibilityRole={"radiogroup"}>
      {options.map((option, index) => (
        <Radio
          key={index}
          isActive={option.value === value}
          disabled={disabled || option.disabled}
          label={option.label}
          description={option.description}
          onChange={() => onChange?.(option.value)}
        />
      ))}
    </Wrapper>
  );
};

export const RadioGroup = memo(
  RadioGroupComponent,
) as typeof RadioGroupComponent;
