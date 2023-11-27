import React, {FC, memo} from 'react';
import {RefreshControl, RefreshControlProps} from 'react-native';
import {useDelayLoading} from '../../../common';

export interface DelayRefreshControlProps extends RefreshControlProps {
  delay?: number;
}

export const DelayRefreshControl: FC<DelayRefreshControlProps> = memo(
  ({delay = 2000, refreshing = false, ...rest}) => {
    const _refreshing = useDelayLoading(delay, refreshing);

    return <RefreshControl refreshing={_refreshing} {...rest} />;
  },
);
