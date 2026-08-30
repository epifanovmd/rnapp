import dayjs from "dayjs";

/** Время в пузыре сообщения. */
export const formatMessageTime = (createdAt: number): string =>
  dayjs(createdAt).format("HH:mm");
