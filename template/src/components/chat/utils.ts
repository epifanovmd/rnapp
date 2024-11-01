import dayjs from "dayjs";

import { IMessage } from "./types";

export function isSameDay(
  currentMessage: IMessage,
  diffMessage: IMessage | undefined,
) {
  if (!diffMessage || !diffMessage.createdAt) {
    return false;
  }

  const currentCreatedAt = dayjs(currentMessage.createdAt);
  const diffCreatedAt = dayjs(diffMessage.createdAt);

  if (!currentCreatedAt.isValid() || !diffCreatedAt.isValid()) {
    return false;
  }

  return currentCreatedAt.isSame(diffCreatedAt, "day");
}

export function isSameUser(
  currentMessage: IMessage,
  diffMessage: IMessage | undefined,
) {
  return !!(
    diffMessage &&
    diffMessage.user &&
    currentMessage.user &&
    diffMessage.user.id === currentMessage.user.id
  );
}
