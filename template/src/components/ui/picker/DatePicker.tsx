import React, {
  FC,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Col, Row} from '../../elements';
import {Text} from '../text';
import {Button, IButtonProps} from '../button';
import {Picker, PickerProps} from './Picker';
import {SafeAreaBottom} from '../safeArea';
import {Touchable, TouchableProps} from '../touchable';
import {Modal, useModal} from '../modal';
import moment from 'moment';
import {useTranslation} from '../../../localization';
import {StyleSheet, ViewProps, ViewStyle} from 'react-native';
import {IModalProps} from '../modal/types';

export interface DatePickerProps extends TouchableProps<any> {
  date?: moment.Moment | null;
  onChange: (date: moment.Moment) => void;
  renderItem?: (item: string, active: boolean, index: number) => JSX.Element;

  pickerProps?: Omit<
    PickerProps<string>,
    'index' | 'items' | 'renderItem' | 'onIndexChange' | 'lineStyle'
  >;

  leftPickerLineStyle?: ViewStyle;
  rightPickerLineStyle?: ViewStyle;

  modalProps?: IModalProps;
  containerProps?: ViewProps;

  actionsContainerProps?: ViewProps;
  resetButtonProps?: IButtonProps;
  acceptButtonProps?: IButtonProps;
}

const years = Array.from({length: 201}, (_, i) => {
  return (i + new Date().getFullYear() - 100).toString();
});

const isLeapYear = (index: number) =>
  (index % 4 === 0 && index % 100 !== 0) || index % 400 === 0;

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
      length: daysInMonth[month](isLeapYear(year)),
    },
    (_, i) => (i + 1).toString(),
  );
};

export const DatePicker: FC<PropsWithChildren<DatePickerProps>> = memo(
  ({
    date,
    onChange,
    renderItem,
    pickerProps,
    leftPickerLineStyle,
    rightPickerLineStyle,
    modalProps,
    containerProps,
    actionsContainerProps,
    resetButtonProps,
    acceptButtonProps,
    children,
    ...rest
  }) => {
    const {i18n} = useTranslation();

    const {ref: modalRef} = useModal();

    const months = useMemo(
      () =>
        moment
          .months()
          .map(item => item[0].toUpperCase() + item.slice(1, item.length)),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [i18n.language],
    );

    const now = useMemo(() => (date ? moment(date) : moment()), [date]);

    const [_day, _month, _year] = useMemo(
      () => [now.get('dates'), now.get('month'), now.get('year')],
      [now],
    );

    const [days, setDays] = useState(generateDays(_month, _year));

    const dayIndex = useRef(_day - 1);
    const monthIndex = useRef(Number(_month));
    const yearIndex = useRef(_year - Number(years[0]));

    const initialIndexes = useRef([
      dayIndex.current,
      monthIndex.current,
      yearIndex.current,
    ]);

    const [initialDayIndex, setInitialDayIndex] = useState<number | undefined>(
      initialIndexes.current[0],
    );
    const [initialMonthIndex, setInitialMonthIndex] = useState<
      number | undefined
    >(initialIndexes.current[1]);
    const [initialYearIndex, setInitialYearIndex] = useState<
      number | undefined
    >(initialIndexes.current[2]);

    const changeDays = useCallback(() => {
      const newDays = generateDays(monthIndex.current, yearIndex.current);
      if (days.length !== newDays.length) {
        setDays(newDays);
      }
    }, [days.length]);

    useEffect(() => {
      dayIndex.current = _day - 1;
      monthIndex.current = Number(_month);
      yearIndex.current = _year - Number(years[0]);

      initialIndexes.current = [
        dayIndex.current,
        monthIndex.current,
        yearIndex.current,
      ];
      setInitialDayIndex(dayIndex.current);
      setInitialMonthIndex(monthIndex.current);
      setInitialYearIndex(yearIndex.current);

      changeDays();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_day, _month, _year]);

    const reset = useCallback(() => {
      setInitialDayIndex((dayIndex.current = initialIndexes.current[0]));
      setInitialMonthIndex((monthIndex.current = initialIndexes.current[1]));
      setInitialYearIndex((yearIndex.current = initialIndexes.current[2]));

      changeDays();
    }, [changeDays]);

    const handleDay = useCallback((field: string, index: number) => {
      dayIndex.current = index;
      setInitialDayIndex(undefined);
    }, []);

    const handleMonth = useCallback(
      (field: string, index: number) => {
        monthIndex.current = index;
        changeDays();
        setInitialMonthIndex(undefined);
      },
      [changeDays],
    );

    const handleYear = useCallback(
      (field: string, index: number) => {
        yearIndex.current = index;

        changeDays();
        setInitialYearIndex(undefined);
      },
      [changeDays],
    );

    const handleApply = useCallback(() => {
      if (onChange) {
        onChange(
          moment(
            new Date(
              `${yearIndex.current + Number(years[0])}-${
                monthIndex.current + 1
              }-${dayIndex.current + 1}`,
            ),
          ),
        );
        modalRef.current?.close();
      }
    }, [modalRef, onChange]);

    const _renderItem = useCallback(
      (item: string, active: boolean, index: number) => {
        return renderItem ? (
          renderItem(item, active, index)
        ) : (
          <Col
            flex={1}
            width={'100%'}
            alignItems={'center'}
            justifyContent={'center'}>
            <Text
              color={active ? 'white' : 'black'}
              numberOfLines={1}
              fontSize={active ? 18 : 12}>
              {item}
            </Text>
          </Col>
        );
      },
      [renderItem],
    );

    const handleOpen = useCallback(() => {
      setInitialDayIndex((dayIndex.current = initialIndexes.current[0]));
      setInitialMonthIndex((monthIndex.current = initialIndexes.current[1]));
      setInitialYearIndex((yearIndex.current = initialIndexes.current[2]));

      changeDays();
      modalRef.current?.open();
    }, [changeDays, modalRef]);

    const _leftPickerLineStyle = useMemo(
      () => ({
        ...s.leftLineStyle,
        ...leftPickerLineStyle,
      }),
      [leftPickerLineStyle],
    );
    const _rightPickerLineStyle = useMemo(
      () => ({
        ...s.rightLineStyle,
        ...rightPickerLineStyle,
      }),
      [rightPickerLineStyle],
    );

    return (
      <Touchable {...rest} onPress={handleOpen}>
        {children}

        <Modal
          ref={modalRef}
          adjustToContentHeight={true}
          childrenPanGestureEnabled={false}
          {...modalProps}>
          <Col pa={16} {...containerProps}>
            <Row>
              <Picker
                itemHeight={27}
                style={s.pickerStyle}
                lineStyle={_leftPickerLineStyle}
                {...pickerProps}
                index={initialDayIndex}
                items={days}
                renderItem={_renderItem}
                onIndexChange={handleDay}
              />
              <Picker
                itemHeight={27}
                style={s.pickerStyle}
                {...pickerProps}
                index={initialMonthIndex}
                items={months}
                renderItem={_renderItem}
                onIndexChange={handleMonth}
              />
              <Picker
                itemHeight={27}
                style={s.pickerStyle}
                lineStyle={_rightPickerLineStyle}
                {...pickerProps}
                index={initialYearIndex}
                items={years}
                renderItem={_renderItem}
                onIndexChange={handleYear}
              />
            </Row>

            <Row
              pt={16}
              justifyContent={'space-between'}
              {...actionsContainerProps}>
              <Button
                title={'Сбросить'}
                {...resetButtonProps}
                onPress={reset}
              />
              <Button
                title={'Применить'}
                {...acceptButtonProps}
                onPress={handleApply}
              />
            </Row>

            <SafeAreaBottom />
          </Col>
        </Modal>
      </Touchable>
    );
  },
);

const s = StyleSheet.create({
  leftLineStyle: {
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10,
    marginLeft: 10,
    paddingRight: 10,
  },

  rightLineStyle: {
    borderBottomRightRadius: 10,
    borderTopRightRadius: 10,
    marginRight: 10,
    paddingLeft: 10,
  },
  pickerStyle: {flex: 1},
});
