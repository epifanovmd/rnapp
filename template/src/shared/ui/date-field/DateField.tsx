import { format as formatDate } from "date-fns";
import React, { FC, memo, useMemo, useRef } from "react";

import { Button } from "../button";
import { Col } from "../flex-view";
import { ITextFieldProps, TextField } from "../input";
import { DatePicker, DatePickerRef } from "../picker";
import { clampDate } from "./clamp-date";

export interface IDateFieldProps extends Pick<
  ITextFieldProps,
  "label" | "placeholder" | "description" | "iconName" | "style"
> {
  value?: Date | null;
  /** Выбранная дата или `null` после сброса. */
  onChange: (date: Date | null) => void;
  /** Сообщение валидации. */
  error?: string;
  /** Крестик сброса в поле. По умолчанию `true`. */
  clearable?: boolean;
  /** Границы выбора: дата вне них поднимается/опускается до границы. */
  minDate?: Date;
  maxDate?: Date;
  /** Формат отображения (date-fns). По умолчанию `d MMMM yyyy`. */
  format?: string;
  /** Заголовок шторки; по умолчанию — `label`. */
  title?: string;
  disabled?: boolean;
}

const DEFAULT_FORMAT = "d MMMM yyyy";

/**
 * Поле даты: TextField-триггер открывает колёсный DatePicker в шторке,
 * выбор применяется кнопкой «Готово», крестик сбрасывает значение в `null`.
 */
export const DateField: FC<IDateFieldProps> = memo(
  ({
    value,
    onChange,
    error,
    clearable = true,
    minDate,
    maxDate,
    format = DEFAULT_FORMAT,
    title,
    disabled,
    label,
    iconName = "calendar",
    ...rest
  }) => {
    const pickerRef = useRef<DatePickerRef>(null);
    const minTime = minDate?.getTime();
    const maxTime = maxDate?.getTime();

    // Без значения колёса стоят на сегодняшней дате в пределах границ.
    const pickerDate = useMemo(
      () =>
        value ??
        clampDate(
          new Date(),
          minTime === undefined ? undefined : new Date(minTime),
          maxTime === undefined ? undefined : new Date(maxTime),
        ),
      [value, minTime, maxTime],
    );

    const handleChange = (date: Date) =>
      onChange(clampDate(date, minDate, maxDate));

    return (
      <>
        <TextField
          {...rest}
          label={label}
          iconName={iconName}
          value={value ? formatDate(value, format) : ""}
          error={error}
          clearable={clearable}
          editable={!disabled}
          onPress={() => pickerRef.current?.open()}
          onClear={() => onChange(null)}
        />
        <DatePicker
          ref={pickerRef}
          title={title ?? label}
          date={pickerDate}
          onChange={handleChange}
          renderFooter={({ onApply }) => (
            <Col ph={16} pt={8}>
              <Button title={"Готово"} onPress={onApply} />
            </Col>
          )}
        />
      </>
    );
  },
);
