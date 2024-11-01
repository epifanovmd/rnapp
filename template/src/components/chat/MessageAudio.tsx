import React, { FC, memo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { IMessage } from "./types";

export interface MessageAudioProps {
  currentMessage: IMessage;
  containerStyle?: StyleProp<ViewStyle>;
  audioStyle?: StyleProp<ViewStyle>;
  audioProps?: object;
}

export const MessageAudio: FC<MessageAudioProps> = memo(
  ({ currentMessage }) => {
    if (!currentMessage.audio) {
      return null;
    }

    return <></>;
  },
);
