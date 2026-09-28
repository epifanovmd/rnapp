import { format, getDefaultOptions } from "date-fns";
import React, {
  FC,
  JSX,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ViewProps } from "react-native";

import {
  BottomSheet,
  TBottomSheetHeaderProps,
  TBottomSheetProps,
  useBottomSheetRef,
} from "../bottom-sheet";
import { Col, Row } from "../flex-view";
import { ITouchableProps, Touchable } from "../touchable";
import {
  Picker,
  PickerChangeItem,
  PickerColumn,
  PickerItem,
  PickerProps,
} from "./shared";

const years = Array.from({ length: 201 }, (_, i) => {
  return i + new Date().getFullYear() - 100;
});

const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = [
  () => 31,
  (isLeap: boolean) => (isLeap ? 29 : 28),
  () => 31,
  () => 30,
  () => 31,
  () => 30,
  () => 31,
  () => 31,
  () => 30,
  () => 31,
  () => 30,
  () => 31,
];

/** Дней в колонке всегда 31: лишние дизейблятся, набор не пересобирается. */
const allDays = Array.from({ length: 31 }, (_, i) => i + 1);

const daysCount = (month: number, year: number) =>
  daysInMonth[month || 0](isLeapYear(year));

/** Названия месяцев в локали date-fns по умолчанию, с заглавной буквы. */
const monthNames = () => {
  const { locale } = getDefaultOptions();

  return Array.from({ length: 12 }, (_, i) => {
    const name = format(new Date(2000, i, 1), "LLLL", { locale });

    return name.charAt(0).toUpperCase() + name.slice(1);
  });
};

export interface DatePickerProps extends ITouchableProps {
  date?: Date | null;
  onChange: (date: Date) => void;
  /** Заголовок шапки листа. */
  title?: string;

  pickerProps?: PickerProps;
  bottomSheetProps?: TBottomSheetProps;
  containerProps?: ViewProps;
  headerProps?: TBottomSheetHeaderProps;

  renderFooter?: (params: {
    onReset: () => void;
    onApply: () => void;
  }) => JSX.Element | null;
}

export const DatePicker: FC<PropsWithChildren<DatePickerProps>> = memo(
  ({
    date,
    onChange,
    title = "Дата",
    pickerProps,
    bottomSheetProps,
    containerProps,
    headerProps,
    renderFooter,
    children,
    ...rest
  }) => {
    const modalRef = useBottomSheetRef();

    const months = useMemo(monthNames, []);

    const now = useMemo(() => date ?? new Date(), [date]);

    const [_day, _month, _year] = useMemo(
      () => [now.getDate(), now.getMonth(), now.getFullYear()],
      [now],
    );

    const [day, setDay] = useState<number>(_day);
    const [month, setMonth] = useState<number>(_month);
    const [year, setYear] = useState<number>(_year);

    const days = useMemo(() => daysCount(month, year), [month, year]);

    const onReset = useCallback(() => {
      setDay(_day);
      setMonth(_month);
      setYear(_year);
    }, [_day, _month, _year]);

    useEffect(() => {
      onReset();
    }, [onReset]);

    const handleDay = useCallback(
      ({ value }: PickerChangeItem) => {
        setDay(Number(value));

        if (onChange && !renderFooter) {
          onChange(new Date(year, month, Number(value)));
        }
      },
      [month, onChange, renderFooter, year],
    );

    const handleMonth = useCallback(
      ({ value }: PickerChangeItem) => {
        setMonth(Number(value));
        const count = daysCount(Number(value), year);

        if (day > count) {
          setDay(count);
        }

        if (onChange && !renderFooter) {
          onChange(new Date(year, Number(value), Math.min(day, count)));
        }
      },
      [day, onChange, renderFooter, year],
    );

    const handleYear = useCallback(
      ({ value }: PickerChangeItem) => {
        setYear(Number(value));

        if (onChange && !renderFooter) {
          onChange(new Date(Number(value), month, day));
        }
      },
      [day, month, onChange, renderFooter],
    );

    const onApply = useCallback(() => {
      if (onChange) {
        onChange(new Date(year, month, day));
        modalRef.current?.close();
      }
    }, [day, modalRef, month, onChange, year]);

    const renderDayItems = useMemo(
      () =>
        allDays.map(item => (
          <PickerItem
            key={item + "day"}
            label={String(item)}
            value={item}
            disabled={item > days}
          />
        )),
      [days],
    );

    const renderMothItems = useMemo(
      () =>
        months.map((item, index) => {
          return (
            <PickerItem
              key={item + "month"}
              label={String(item)}
              value={index}
            />
          );
        }),
      [months],
    );

    const renderYearItems = useMemo(
      () =>
        years.map(item => {
          return (
            <PickerItem key={item + "year"} label={String(item)} value={item} />
          );
        }),
      [],
    );

    const handleOpen = useCallback(() => {
      onReset();
      modalRef.current?.present();
    }, [modalRef, onReset]);

    return (
      <Touchable {...rest} onPress={handleOpen}>
        {children}

        <BottomSheet ref={modalRef} {...bottomSheetProps}>
          <BottomSheet.Header centered={true} label={title} {...headerProps} />

          <BottomSheet.Content {...containerProps}>
            <Row ph={8} pb={8} justifyContent={"space-between"}>
              <Col flexGrow={1} flexBasis={0} minWidth={20}>
                <Picker {...pickerProps}>
                  <PickerColumn selectedValue={day} onChange={handleDay}>
                    {renderDayItems}
                  </PickerColumn>
                </Picker>
              </Col>
              <Col flexGrow={3} flexBasis={0}>
                <Picker {...pickerProps}>
                  <PickerColumn selectedValue={month} onChange={handleMonth}>
                    {renderMothItems}
                  </PickerColumn>
                </Picker>
              </Col>
              <Col flexGrow={1} flexBasis={0} minWidth={40}>
                <Picker {...pickerProps}>
                  <PickerColumn selectedValue={year} onChange={handleYear}>
                    {renderYearItems}
                  </PickerColumn>
                </Picker>
              </Col>
            </Row>

            {renderFooter?.({ onReset, onApply })}
          </BottomSheet.Content>
        </BottomSheet>
      </Touchable>
    );
  },
);
