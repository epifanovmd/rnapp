import React, {forwardRef, memo, useMemo, useRef} from 'react';
import {Modalize} from 'react-native-modalize';
import {IProps} from 'react-native-modalize/lib/options';
import {StyleSheet, useWindowDimensions} from 'react-native';
import {isBoolean, isNumber} from 'lodash';
import {Portal} from 'react-native-portalize';

interface ModalProps extends Omit<IProps, 'alwaysOpen'> {
  alwaysOpen?: boolean | number;
}

export const useModalRef = () => useRef<Modalize>(null);

export const Modal = memo(
  forwardRef<Modalize, ModalProps>(
    ({alwaysOpen, children, scrollViewProps, flatListProps, ...rest}, ref) => {
      const {height} = useWindowDimensions();

      const _scrollViewProps = useMemo(
        () =>
          flatListProps
            ? undefined
            : {
                contentContainerStyle: styles.contentContainerStyle,
                ...scrollViewProps,
              },
        [flatListProps, scrollViewProps],
      );

      const _alwaysOpen = useMemo(
        () =>
          isNumber(alwaysOpen)
            ? alwaysOpen
            : isBoolean(alwaysOpen) && alwaysOpen
            ? height
            : undefined,
        [alwaysOpen, height],
      );

      return (
        <Portal>
          <Modalize
            ref={ref}
            scrollViewProps={_scrollViewProps}
            alwaysOpen={_alwaysOpen}
            flatListProps={flatListProps}
            {...rest}
            adjustToContentHeight={true}>
            {flatListProps ? undefined : children}
          </Modalize>
        </Portal>
      );
    },
  ),
);

const styles = StyleSheet.create({
  contentContainerStyle: {flexGrow: 1},
});
