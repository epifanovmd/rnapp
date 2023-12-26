import React, {
  FC,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Col,
  Modal,
  ModalProps,
  Picker,
  PickerChangeItem,
  PickerColumn,
  PickerItem,
  PickerProps,
  Row,
  SafeArea,
  Touchable,
  TouchableProps,
  useModal,
} from '@force-dev/react-mobile';
import moment from 'moment';
import {useTranslation} from '../../../localization';
import {ViewProps} from 'react-native';
import {Button, ButtonProps} from '../button';

const years = Array.from({length: 201}, (_, i) => {
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

export interface DatePickerProps extends TouchableProps {
  date?: moment.Moment | null;
  onChange: (date: moment.Moment) => void;

  pickerProps?: PickerProps;

  modalProps?: ModalProps;
  containerProps?: ViewProps;

  actionsContainerProps?: ViewProps;
  resetButtonProps?: ButtonProps;
  acceptButtonProps?: ButtonProps;
}

export const DatePicker: FC<PropsWithChildren<DatePickerProps>> = memo(
  ({
    date,
    onChange,
    pickerProps,
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

    const [day, setDay] = useState<number>(_day);
    const [month, setMonth] = useState<number>(_month);
    const [year, setYear] = useState<number>(_year);

    const days = useMemo(() => generateDays(month, year), [month, year]);

    const reset = useCallback(() => {
      setDay(_day);
      setMonth(_month);
      setYear(_year);
    }, [_day, _month, _year]);

    useEffect(() => {
      reset();
    }, [reset]);

    const handleDay = useCallback(({value}: PickerChangeItem) => {
      setDay(Number(value));
    }, []);

    const handleMonth = useCallback(
      ({value}: PickerChangeItem) => {
        setMonth(Number(value));
        const daysCount = daysInMonth[Number(value)](isLeapYear(year));
        if (day > daysCount) {
          setDay(daysCount);
        }
      },
      [day, year],
    );

    const handleYear = useCallback(({value}: PickerChangeItem) => {
      setYear(Number(value));
    }, []);

    const handleApply = useCallback(() => {
      if (onChange) {
        onChange(moment(new Date(`${year}-${month + 1}-${day}`)));
        modalRef.current?.close();
      }
    }, [day, modalRef, month, onChange, year]);

    const renderDayItems = useMemo(
      () =>
        days.map(item => {
          return (
            <PickerItem key={item + 'day'} label={String(item)} value={item} />
          );
        }),
      [days],
    );

    const renderMothItems = useMemo(
      () =>
        months.map((item, index) => {
          return (
            <PickerItem
              key={item + 'month'}
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
            <PickerItem key={item + 'year'} label={String(item)} value={item} />
          );
        }),
      [],
    );

    const handleOpen = useCallback(() => {
      reset();
      modalRef.current?.open();
    }, [modalRef, reset]);

    return (
      <Touchable {...rest} onPress={handleOpen}>
        {children}

        <Modal
          ref={modalRef}
          adjustToContentHeight={true}
          childrenPanGestureEnabled={false}
          {...modalProps}>
          <Col pa={16} {...containerProps}>
            <Row justifyContent={'space-between'}>
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

            <SafeArea bottom />
          </Col>
        </Modal>
      </Touchable>
    );
  },
);
