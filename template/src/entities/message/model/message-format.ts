import { format } from "date-fns";

/** Время в пузыре сообщения. */
export const formatMessageTime = (createdAt: number): string =>
  format(createdAt, "HH:mm");
