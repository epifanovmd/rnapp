import type { NodeDto, UserDto } from "@shared/api/gen/main/model";

/** Пользователь в списке выбора владельца. */
export interface IOwnerOption {
  value: string;
  label: string;
}

/** Опции без повторов по id: первая встреченная побеждает. */
export const uniqueOptions = (options: IOwnerOption[]): IOwnerOption[] =>
  options.filter(
    (option, index) =>
      options.findIndex(item => item.value === option.value) === index,
  );

/**
 * Опции без права на список пользователей: текущий владелец узла и сам
 * пользователь.
 */
export const fallbackOwnerOptions = (
  node: Pick<NodeDto, "ownerId" | "ownerName"> | null,
  me: Pick<UserDto, "id" | "email"> | null,
): IOwnerOption[] => [
  // Владелец — сам пользователь: одна запись с пометкой «(вы)».
  ...(node?.ownerId && node.ownerId !== me?.id
    ? [{ value: node.ownerId, label: node.ownerName ?? node.ownerId }]
    : []),
  ...(me
    ? [{ value: me.id, label: me.email ? `${me.email} (вы)` : "Вы" }]
    : []),
];
