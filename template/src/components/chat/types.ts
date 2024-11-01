import React from "react";
import { ImageStyle, StyleProp } from "react-native";

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export interface LeftRightStyle<T> {
  left?: StyleProp<T>;
  right?: StyleProp<T>;
}

export interface User {
  id: string | number;
  name?: string;
  avatar?: string | ((style: StyleProp<ImageStyle>) => React.JSX.Element);
}

export interface MessageMediaFile {
  id: number;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  id: string;
  user: User;

  text: string;
  image?: MessageMediaFile;
  video?: MessageMediaFile;
  audio?: MessageMediaFile;

  reply?: IMessage;
  replyId?: string;

  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: number;

  createdAt: string | Date;
  updatedAt: string | Date;
}

export type IChatMessage = IMessage;
