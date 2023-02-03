import React, {FC, useEffect, useRef, useState} from 'react';
import {ActivityIndicator} from 'react-native';
import {FlexComponentProps, FlexView} from '../elements';
import {useTheme} from '../../theme';

interface IProps extends FlexComponentProps {
  loading?: boolean;
}

export const LoadingContent: FC<IProps> = ({children, loading, ...rest}) => {
  const [isLoading, setIsLoading] = useState(false);
  const {theme} = useTheme();

  const timeoutId = useRef<any>();

  useEffect(() => {
    if (loading) {
      timeoutId.current = setTimeout(() => {
        setIsLoading(true);
      }, 2000);
    } else {
      setIsLoading(false);
    }

    return () => {
      timeoutId && clearTimeout(timeoutId.current);
    };
  }, [loading]);

  return (
    <FlexView bg={'transparent'} {...rest}>
      {isLoading && (
        <ActivityIndicator size={'large'} color={theme.color.grey.grey900} />
      )}
      {children}
    </FlexView>
  );
};
