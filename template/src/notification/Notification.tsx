import React, {FC, useCallback, useEffect, useMemo, useState} from 'react';
import {Animated} from 'react-native';

import {
  getCompoundedProps,
  getNotificationPositionStyle,
  getNotificationTransition,
} from './helpers';
import {NotificationItem, NotificationMessage} from './NotificationItem';
import {NotificationOptions} from './notification.types';
import NotificationManager from './notificationManager';

interface NotificationProvidedValue {
  showMessage: (
    message: NotificationMessage,
    options?: NotificationOptions,
  ) => string;
  hideMessage: (id?: string) => void;
}

export const NotificationContext =
  React.createContext<NotificationProvidedValue>({
    showMessage: () => {
      console.log('NotificationProvider is not rendered!');

      return 'NotificationProvider is not rendered!';
    },
    hideMessage: () => {
      console.log('NotificationProvider is not rendered!');
    },
  });

interface NotificationProps extends NotificationOptions {}

const _hideTimeout: {
  [key in string]: any;
} = {};

interface NotifyData {
  [key: string]: {
    message: NotificationMessage;
    options: NotificationOptions;
    visibleValue: Animated.Value;
    isHidding: boolean;
  };
}

const defaults: NotificationOptions = {
  animated: true,
  animationDuration: 225,
  hideOnPress: false,
  duration: 1850,
  autoHide: true,
  position: 'top',
  backgroundColor: '#ff3a41',
  color: '#fff',
  floating: true,
};

export const Notification: FC<NotificationProps> = ({children, ...rest}) => {
  const [notifyData, setNotifyData] = useState<NotifyData>({});

  const deleteNotify = useCallback((id: string) => {
    setNotifyData(state => {
      const newState = {...state};

      delete newState[id];

      return newState;
    });
  }, []);

  const compoundedOptions = useCallback(
    <
      T extends NotificationOptions = NotificationOptions,
      K extends keyof NotificationOptions = keyof NotificationOptions,
    >(
      options: T,
      prop: K,
    ) =>
      getCompoundedProps<NotificationOptions, K>(
        rest,
        options,
        prop,
        defaults[prop],
      ),
    [rest],
  );

  const toggleVisibility = useCallback(
    (
      id: string,
      visible: boolean = true,
      animated: boolean = true,
      opt: NotificationOptions,
      visibleValue: Animated.Value,
    ) => {
      if (_hideTimeout[id]) {
        clearTimeout(_hideTimeout[id]);
        delete _hideTimeout[id];
      }

      const autoHide = compoundedOptions(opt, 'autoHide');
      const duration = compoundedOptions(opt, 'duration');
      const animationDuration = compoundedOptions(opt, 'animationDuration');

      if (visible) {
        const finish = () => {
          if (!!autoHide && duration && duration > 0) {
            _hideTimeout[id] = setTimeout(
              () => toggleVisibility(id, false, animated, opt, visibleValue),
              duration,
            );
          }
        };

        visibleValue.setValue(0);

        if (animated) {
          Animated.timing(visibleValue, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          }).start(finish);
        } else {
          finish();
        }
      } else {
        const finish = () => {
          deleteNotify(id);
        };

        if (animated) {
          Animated.timing(visibleValue, {
            toValue: 0,
            duration: animationDuration,
            useNativeDriver: true,
          }).start(finish);
        } else {
          finish();
        }
      }
    },
    [compoundedOptions, deleteNotify],
  );

  const showMessage: NotificationProvidedValue['showMessage'] = useCallback(
    (msg: NotificationMessage, opt: NotificationOptions = {}) => {
      const id = Math.random().toString(16).slice(2);

      if (msg) {
        const animated = compoundedOptions(opt, 'animated');
        const visibleValue = new Animated.Value(0);

        setNotifyData(state => ({
          ...state,
          [id]: {
            options: opt,
            message: msg,
            isHidding: false,
            visibleValue,
          },
        }));

        toggleVisibility(id, true, animated, opt, visibleValue);

        return id;
      }

      deleteNotify(id);

      return id;
    },
    [compoundedOptions, deleteNotify, toggleVisibility],
  );

  const hideMessage: NotificationProvidedValue['hideMessage'] = useCallback(
    (id?: string) => {
      if (id) {
        const notifyItem = notifyData[id];

        if (notifyItem) {
          const animated = compoundedOptions(notifyItem.options, 'animated');

          toggleVisibility(
            id,
            false,
            animated,
            notifyItem.options,
            notifyItem.visibleValue,
          );
        }
      } else {
        Object.keys(notifyData).forEach(key => {
          const _notifyItem = notifyData[key]!;
          const animated = compoundedOptions(_notifyItem.options, 'animated');

          toggleVisibility(
            key,
            false,
            animated,
            _notifyItem.options,
            _notifyItem.visibleValue,
          );
        });
      }
    },
    [compoundedOptions, notifyData, toggleVisibility],
  );

  const pressMessage = useCallback(
    (id: string) => {
      const {options, isHidding} = notifyData[id]!;
      const isHideOnPress = compoundedOptions(options, 'hideOnPress');

      if (!isHidding) {
        if (isHideOnPress) {
          hideMessage(id);
        }
      }
    },
    [compoundedOptions, hideMessage, notifyData],
  );

  const providerValue: NotificationProvidedValue = useMemo(
    () => ({
      showMessage,
      hideMessage,
    }),
    [hideMessage, showMessage],
  );

  useEffect(() => {
    NotificationManager.register(providerValue);
  }, [providerValue]);

  useEffect(
    () => () => {
      NotificationManager.unRegister();
      Object.keys(_hideTimeout).forEach(key => {
        const timeoutId = _hideTimeout[key];

        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    },
    [],
  );

  const renderNotifyItem = useCallback(
    (id: string) => {
      const notifyItem = notifyData[id]!;

      const position = compoundedOptions(notifyItem.options, 'position');
      const backgroundColor = compoundedOptions(
        notifyItem.options,
        'backgroundColor',
      );
      const color = compoundedOptions(notifyItem.options, 'color');
      const floating = compoundedOptions(notifyItem.options, 'floating');
      const style = compoundedOptions(notifyItem.options, 'style');

      const itemOptions: NotificationOptions = {
        ...rest,
        ...notifyItem.options,
        position,
        backgroundColor,
        color,
        floating,
        style,
      };

      const animated = compoundedOptions(notifyItem.options, 'animated');
      const _animStyle = animated
        ? getNotificationTransition(notifyItem.visibleValue, position)
        : {};
      const animStyle = [getNotificationPositionStyle(position), _animStyle];

      return (
        <Animated.View key={id} pointerEvents="box-none" style={animStyle}>
          {!!notifyItem.message && (
            <NotificationItem
              key={id}
              message={notifyItem.message}
              options={itemOptions}
              id={id}
              onClose={pressMessage}
            />
          )}
        </Animated.View>
      );
    },
    [compoundedOptions, notifyData, pressMessage, rest],
  );

  return (
    <NotificationContext.Provider value={providerValue}>
      {Object.keys(notifyData).map(key => renderNotifyItem(key))}
      {children}
    </NotificationContext.Provider>
  );
};
