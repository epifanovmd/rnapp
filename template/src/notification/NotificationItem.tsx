import React, {FC, memo, useCallback, useMemo} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {NotificationOptions} from './notification.types';
import {isAndroid, isIPhoneX, useIsLandscape} from '../common';
import {getNotificationStatusBarHeight} from './helpers';
import {Col, Row, Touchable} from '../components';

const NOTIFICATION_ICONS = {
  loading: (color?: string) => <ActivityIndicator color={color} />,
};

export interface MessageObject<IconObject extends object = {}> {
  title?: string;
  description?: string;
  icon?: keyof IconObject;
}

export type NotificationMessage =
  | string
  | JSX.Element
  | MessageObject<typeof NOTIFICATION_ICONS>;

interface IProps {
  id: string;
  message: NotificationMessage;
  options?: NotificationOptions;
  onClose?: (id: string) => void;
}

export const NotificationItem: FC<IProps> = memo(
  ({id, message, options = {}, onClose}) => {
    const {
      position = 'top',
      backgroundColor,
      color,
      floating,
      style,
      hideOnPress,
      ...viewProps
    } = options;

    const isLandscape = useIsLandscape();

    const _statusBarHeight = getNotificationStatusBarHeight(isLandscape);

    const wrapper = useMemo(
      () => ({
        isLandscape,
        statusBarHeight: _statusBarHeight,
        insetTop: position === 'top' ? _statusBarHeight : 0,
        insetLeft:
          (position === 'top' || position === 'bottom') && isLandscape
            ? isIPhoneX
              ? 21
              : 0
            : 0,
        insetRight:
          (position === 'top' || position === 'bottom') && isLandscape
            ? isIPhoneX
              ? 21
              : 0
            : 0,
        insetBottom:
          isIPhoneX && position === 'bottom'
            ? isLandscape
              ? 24
              : 34
            : isAndroid
            ? 2
            : 0,
      }),
      [_statusBarHeight, isLandscape, position],
    );

    const viewStyle = useMemo(
      () => [
        styles.defaultFlash,
        position === 'center' && styles.defaultFlashCenter,
        floating && styles.defaultFlashFloating,
        {backgroundColor},
        {
          marginTop: wrapper.insetTop,
          marginBottom: wrapper.insetBottom,
        },
        style,
      ],
      [
        backgroundColor,
        floating,
        position,
        style,
        wrapper.insetBottom,
        wrapper.insetTop,
      ],
    );
    const textStyle = useMemo(() => ({color}), [color]);

    const handleClose = useCallback(() => {
      if (onClose) {
        onClose(id);
      }
    }, [id, onClose]);

    return (
      <View {...viewProps} style={viewStyle}>
        {typeof message === 'string' ? (
          <Text style={textStyle}>{message}</Text>
        ) : typeof message === 'object' ? (
          <Row flexGrow={1} alignItems={'center'} pa={6}>
            {(message as any).icon && (
              <Col mr={12}>
                {NOTIFICATION_ICONS[
                  (message as MessageObject<typeof NOTIFICATION_ICONS>)
                    .icon as keyof typeof NOTIFICATION_ICONS
                ](textStyle.color)}
              </Col>
            )}
            <Col flexShrink={1} flexGrow={1}>
              {!!(message as MessageObject).title && (
                <Text style={textStyle}>
                  {(message as MessageObject).title}
                </Text>
              )}
              {!!(message as MessageObject).description && (
                <Text style={textStyle}>
                  {(message as MessageObject).description}
                </Text>
              )}
            </Col>
            {hideOnPress && (
              <Touchable ml={12} alignSelf={'flex-start'} onPress={handleClose}>
                <Text>X</Text>
              </Touchable>
            )}
          </Row>
        ) : (
          message
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  defaultFlash: {
    padding: 5,
    zIndex: 1000,
  },
  defaultFlashCenter: {
    margin: 44,
    borderRadius: 8,
    overflow: 'hidden',
  },
  defaultFlashFloating: {
    marginHorizontal: 8,
    marginVertical: 10,

    borderRadius: 4,
  },
});
