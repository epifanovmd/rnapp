import React, {FC, memo, PropsWithChildren, useMemo} from 'react';
import {Col} from '../../elements';

interface IProps {
  width: number;
  height?: number;
}

export const CarouselItem: FC<PropsWithChildren<IProps>> = memo(
  ({width, height = 200, children}) => {
    const style = useMemo(() => ({flex: 1, width, height}), [width, height]);
    return <Col style={style}>{children}</Col>;
  },
);
