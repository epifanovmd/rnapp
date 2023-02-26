import React, {FC, memo, PropsWithChildren} from 'react';
import {StyleSheet} from 'react-native';
import {Col} from '../../elements';

interface IProps {
  width: number;
  height?: number;
}

export const CarouselItem: FC<PropsWithChildren<IProps>> = memo(
  ({width, height = 200, children}) => {
    return <Col style={{...styles.wrap, width, height}}>{children}</Col>;
  },
);
const styles = StyleSheet.create({
  wrap: {
    height: 200,
    flex: 1,
  },
});
