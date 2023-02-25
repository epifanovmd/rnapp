import React, {FC, useCallback, useMemo} from 'react';
import {Alert, Linking} from 'react-native';
import {Text} from '../text';
import {Touchable} from '../touchable';
import {useTheme} from '../../../theme';
import {IButtonProps} from './Button';

export interface ITextButtonProps extends IButtonProps {
  url?: string;
}

export const TextButton: FC<ITextButtonProps> = ({
  children,
  url,
  color,
  title,
  ...rest
}) => {
  const {theme} = useTheme();

  const handlePress = useCallback(async () => {
    if (url) {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(`Don't know how to open this URL: ${url}`);
      }
    }
  }, [url]);

  const buttonColor = useMemo(
    () =>
      color
        ? color
        : rest.disabled
        ? theme.color.primary.contrastText
        : theme.color.grey.grey600,
    [
      color,
      rest.disabled,
      theme.color.grey.grey600,
      theme.color.primary.contrastText,
    ],
  );

  return (
    <Touchable
      justifyContent={'center'}
      flexShrink={1}
      activeOpacity={0.7}
      onPress={url ? handlePress : rest.onPress}
      disabled={rest.disabled}>
      <Text
        fontSize={14}
        fontWeight={'bold'}
        letterSpacing={1.4}
        color={buttonColor}
        {...rest}>
        {children || title}
      </Text>
    </Touchable>
  );
};
