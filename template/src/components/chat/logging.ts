const styleString = (color: string) => `color: ${color}; font-weight: bold`;
const headerLog = "%c[react-native-gifted-chat]";

export const error = (...args: any) =>
  console.log(headerLog, styleString("red"), ...args);
