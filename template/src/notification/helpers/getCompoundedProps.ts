import {NotificationOptions} from '../notification.types';

export const getCompoundedProps = <
  T extends NotificationOptions,
  K extends keyof T,
>(
  props: T,
  options: T,
  prop: K,
  defaultValue: T[K],
): T[K] =>
  options[prop] !== undefined
    ? options[prop]
    : props[prop] !== undefined
    ? props[prop]
    : defaultValue;
