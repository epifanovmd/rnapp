import React, { FC, memo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { IMessage } from "./types";

export interface MessageVideoProps {
  currentMessage?: IMessage;
  containerStyle?: StyleProp<ViewStyle>;
  videoStyle?: StyleProp<ViewStyle>;
  videoProps?: object;
}

export const MessageVideo: FC<MessageVideoProps> = memo(() => {
  return <></>;
});
