import React, {
  JSX,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ViewProps, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BottomSheet,
  TBottomSheetHeaderProps,
  TBottomSheetProps,
  useBottomSheetRef,
} from "../bottom-sheet";
import { Row } from "../flex-view";
import { ITouchableProps, Touchable } from "../touchable";
import { LockableColumn } from "./LockableColumn";
import {
  Picker,
  PickerChangeItem,
  PickerColumn,
  PickerItem,
  PickerItemValue,
  PickerProps,
  PickerScrollStateEvent,
} from "./shared";

export interface RangePickerProps<
  T extends string | number,
> extends ITouchableProps {
  items: T[];
  range?: [T | undefined, T | undefined] | null;
  onChange?: (range: [T, T]) => void;
  emptyLabel?: [string, string];
  reverse?: boolean;
  /** Заголовок шапки листа. */
  title?: string;

  pickerProps?: Omit<PickerProps, "onChange">;
  bottomSheetProps?: TBottomSheetProps;
  containerProps?: ViewProps;
  headerProps?: TBottomSheetHeaderProps;

  renderFooter?: (params: {
    onReset: () => void;
    onApply: () => void;
  }) => JSX.Element | null;
}

interface RangePicker {
  <T extends string | number>(
    props: PropsWithChildren<RangePickerProps<T>>,
  ): React.ReactNode;
}

const empty = -1;

const isEmpty = (value?: PickerItemValue) =>
  value === undefined || value === empty;

export const RangePicker: RangePicker = memo(
  ({
    items: _items,
    range,
    onChange,
    emptyLabel = ["от", "до"],
    reverse = false,
    title = "Диапазон",
    children,
    pickerProps,
    bottomSheetProps,
    containerProps,
    headerProps,
    renderFooter,
    ...rest
  }: PropsWithChildren<RangePickerProps<any>>) => {
    const modalRef = useBottomSheetRef();

    // Порядок отображения. `reverse` влияет только на него: левая колонка —
    // всегда нижняя граница диапазона, правая — верхняя.
    const values = useMemo(
      () => (reverse ? [..._items].reverse() : _items),
      [reverse, _items],
    );

    const [currentFirstItem, setCurrentFirstItem] = useState<
      PickerItemValue | undefined
    >(range?.[0]);

    const [currentSecondItem, setCurrentSecondItem] = useState<
      PickerItemValue | undefined
    >(range?.[1]);

    /** Колонка, которую сейчас крутят: соседняя блокируется до остановки. */
    const [activeColumn, setActiveColumn] = useState<number>();

    // Список урезается по соседней границе: недопустимых значений в колонке
    // просто нет, поэтому колесо нигде не запирается. «От»/«До» — всегда сверху.
    const firstValues = useMemo(() => {
      const bound = currentSecondItem;

      return isEmpty(bound)
        ? [empty, ...values]
        : [empty, ...values.filter(item => item <= bound!)];
    }, [currentSecondItem, values]);

    const secondValues = useMemo(() => {
      const bound = currentFirstItem;

      return isEmpty(bound)
        ? [empty, ...values]
        : [empty, ...values.filter(item => item >= bound!)];
    }, [currentFirstItem, values]);

    const renderFirstItems = useMemo(
      () =>
        firstValues.map(item => (
          <PickerItem
            key={`${item}first`}
            label={item === empty ? emptyLabel[0] : String(item)}
            value={item}
          />
        )),
      [emptyLabel, firstValues],
    );

    const renderSecondItems = useMemo(
      () =>
        secondValues.map(item => (
          <PickerItem
            key={`${item}second`}
            label={item === empty ? emptyLabel[1] : String(item)}
            value={item}
          />
        )),
      [emptyLabel, secondValues],
    );

    const onReset = useCallback(() => {
      setCurrentFirstItem(empty);
      setCurrentSecondItem(empty);
    }, []);

    const onUpdate = useCallback(() => {
      setCurrentFirstItem(range?.[0]);
      setCurrentSecondItem(range?.[1]);
    }, [range]);

    useEffect(() => {
      onUpdate();
    }, [onUpdate]);

    // Сосед разблокируется только когда крутящееся колесо остановилось.
    const handleScrollState = useCallback(
      (column: number, { state }: PickerScrollStateEvent) => {
        setActiveColumn(state === "idle" ? undefined : column);
      },
      [],
    );

    const handleChange = useCallback(
      (column: number, { value }: PickerChangeItem) => {
        const first = column === 0 ? value : currentFirstItem;
        const second = column === 1 ? value : currentSecondItem;

        if (column === 0) {
          setCurrentFirstItem(value);
        } else {
          setCurrentSecondItem(value);
        }

        if (onChange && !renderFooter) {
          onChange([
            isEmpty(first) ? undefined : first,
            isEmpty(second) ? undefined : second,
          ]);
        }
      },
      [currentFirstItem, currentSecondItem, onChange, renderFooter],
    );

    // Колонка в событии всегда нулевая: одно колесо — один нативный вью.
    const handleFirstChange = useCallback(
      (item: PickerChangeItem) => handleChange(0, item),
      [handleChange],
    );

    const handleSecondChange = useCallback(
      (item: PickerChangeItem) => handleChange(1, item),
      [handleChange],
    );

    const handleFirstState = useCallback(
      (event: PickerScrollStateEvent) => handleScrollState(0, event),
      [handleScrollState],
    );

    const handleSecondState = useCallback(
      (event: PickerScrollStateEvent) => handleScrollState(1, event),
      [handleScrollState],
    );

    const onApply = useCallback(() => {
      modalRef.current?.close();
    }, [modalRef]);

    const handleOpen = useCallback(() => {
      onUpdate();
      modalRef.current?.present();
    }, [modalRef, onUpdate]);

    const isLocked = (column: number) =>
      activeColumn !== undefined && activeColumn !== column;

    return (
      <Touchable {...rest} onPress={handleOpen}>
        {children}

        <BottomSheet ref={modalRef} {...bottomSheetProps}>
          <BottomSheet.Header centered={true} label={title} {...headerProps} />

          <BottomSheet.Content {...containerProps}>
            <Row pb={16} ph={8} justifyContent={"space-around"}>
              <LockableColumn locked={isLocked(0)} style={firstColumnStyle}>
                <Picker
                  onChange={handleFirstChange}
                  onScrollStateChange={handleFirstState}
                  {...pickerProps}
                >
                  <PickerColumn
                    selectedValue={currentFirstItem}
                    enabled={!isLocked(0)}
                  >
                    {renderFirstItems}
                  </PickerColumn>
                </Picker>
              </LockableColumn>
              <LockableColumn locked={isLocked(1)} style={secondColumnStyle}>
                <Picker
                  onChange={handleSecondChange}
                  onScrollStateChange={handleSecondState}
                  {...pickerProps}
                >
                  <PickerColumn
                    selectedValue={currentSecondItem}
                    enabled={!isLocked(1)}
                  >
                    {renderSecondItems}
                  </PickerColumn>
                </Picker>
              </LockableColumn>
            </Row>

            {renderFooter?.({ onReset, onApply })}
            <SafeAreaView edges={["bottom"]} />
          </BottomSheet.Content>
        </BottomSheet>
      </Touchable>
    );
  },
);

const firstColumnStyle: ViewStyle = { paddingRight: 8 };
const secondColumnStyle: ViewStyle = { paddingLeft: 8 };
