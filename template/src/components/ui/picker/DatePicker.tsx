import { useTranslation } from "@core";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { Col, Row } from "../../flexView";
import {
  BottomSheet,
  BottomSheetProps,
  useBottomSheetRef,
} from "../bottomSheet";
import { ITouchableProps, Touchable } from "../touchable";
import {
  Picker,
  PickerChangeItem,
  PickerColumn,
  PickerItem,
  PickerProps,
} from "./shared";

dayjs.extend(localeData);

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

const generateDays = (month: number, year: number) => {
  return Array.from(
    {
      length: daysInMonth[month || 0](isLeapYear(year)),
    },
    (_, i) => i + 1,
  );
};

export interface DatePickerProps extends ITouchableProps {
  date?: dayjs.Dayjs | null;
  onChange: (date: dayjs.Dayjs) => void;

  pickerProps?: PickerProps;
  bottomSheetProps?: BottomSheetProps;
  containerProps?: ViewProps;

  renderHeader?: (onClose: () => void) => JSX.Element | null;
  renderFooter?: (params: {
    onReset: () => void;
    onApply: () => void;
  }) => JSX.Element | null;
}

export const DatePicker: FC<PropsWithChildren<DatePickerProps>> = memo(
  ({
    date,
    onChange,
    pickerProps,
    bottomSheetProps,
    containerProps,
    renderHeader,
    renderFooter,
    children,
    ...rest
  }) => {
    const { i18n } = useTranslation();
    const modalRef = useBottomSheetRef();

    const months = useMemo(
      () =>
        dayjs
          .months()
          .map(item => item[0]?.toUpperCase() + item.slice(1, item.length)),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [i18n.language],
    );

    const now = useMemo(() => (date ? dayjs(date) : dayjs()), [date]);

    const [_day, _month, _year] = useMemo(
      () => [now.get("dates"), now.get("month"), now.get("year")],
      [now],
    );

    const [day, setDay] = useState<number>(_day);
    const [month, setMonth] = useState<number>(_month);
    const [year, setYear] = useState<number>(_year);

    const days = useMemo(() => generateDays(month, year), [month, year]);

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
          onChange(dayjs(new Date(`${year}-${month + 1}-${Number(value)}`)));
        }
      },
      [month, onChange, renderFooter, year],
    );

    const handleMonth = useCallback(
      ({ value }: PickerChangeItem) => {
        setMonth(Number(value));
        const daysCount = daysInMonth[Number(value)](isLeapYear(year));

        if (day > daysCount) {
          setDay(daysCount);
        }

        if (onChange && !renderFooter) {
          onChange(
            dayjs(
              new Date(
                `${year}-${Number(value) + 1}-${
                  day > daysCount ? daysCount : day
                }`,
              ),
            ),
          );
        }
      },
      [day, onChange, renderFooter, year],
    );

    const handleYear = useCallback(
      ({ value }: PickerChangeItem) => {
        setYear(Number(value));

        if (onChange && !renderFooter) {
          onChange(dayjs(new Date(`${Number(value)}-${month + 1}-${day}`)));
        }
      },
      [day, month, onChange, renderFooter],
    );

    const onApply = useCallback(() => {
      if (onChange) {
        onChange(dayjs(new Date(`${year}-${month + 1}-${day}`)));
        modalRef.current?.close();
      }
    }, [day, modalRef, month, onChange, year]);

    const renderDayItems = useMemo(
      () =>
        days.map(item => {
          return (
            <PickerItem key={item + "day"} label={String(item)} value={item} />
          );
        }),
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

    const onClose = useCallback(() => {
      modalRef.current?.close();
    }, [modalRef]);

    const handleOpen = useCallback(() => {
      onReset();
      modalRef.current?.present();
    }, [modalRef, onReset]);

    return (
      <Touchable {...rest} onPress={handleOpen}>
        {children}

        <BottomSheet ref={modalRef} {...bottomSheetProps}>
          <BottomSheetView {...containerProps}>
            {renderHeader?.(onClose)}

            <Row pa={8} justifyContent={"space-between"}>
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
            <SafeAreaView edges={["bottom"]} />
          </BottomSheetView>
        </BottomSheet>
      </Touchable>
    );
  },
);
