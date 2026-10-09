import { IUserStore } from "@entities/user";
import { IMainApi } from "@shared/api";
import type { NodeDto } from "@shared/api/gen/main/model";
import { useCollection } from "@shared/lib/holders";
import { notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { useState } from "react";

import {
  fallbackOwnerOptions,
  type IOwnerOption,
  uniqueOptions,
} from "./owner-options";

/** Право на список пользователей. */
const USER_VIEW_PERMISSION = "user:view";

interface IUseAssignNodeOwnerOptions {
  onSaved: (node: NodeDto) => void;
}

/**
 * Назначение и снятие владельца узла. Список пользователей — с правом на их
 * просмотр; без него на выбор — текущий владелец и сам пользователь.
 */
export const useAssignNodeOwnerVM = ({
  onSaved,
}: IUseAssignNodeOwnerOptions) => {
  const api = IMainApi.useInstance();
  const toast = INotificationService.useInstance();
  const userStore = IUserStore.useInstance();
  const [open, setOpen] = useState(false);
  const [node, setNode] = useState<NodeDto | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);
  const canListUsers = userStore.can(USER_VIEW_PERMISSION);

  const users = useCollection<IOwnerOption, boolean>({
    queryFn: async () => {
      const { data, error } = await api.getUserOptions();

      return {
        data:
          data?.data.map(option => ({
            value: option.id,
            label: option.name ?? option.id,
          })) ?? null,
        error,
      };
    },
    enabled: open && canListUsers,
    watch: [open],
  });

  const fallback = fallbackOwnerOptions(node, userStore.user);

  const openFor = (target: NodeDto) => {
    setUserId(target.ownerId);
    setNode(target);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const save = async () => {
    if (!node) return;
    if (userId === node.ownerId) {
      close();

      return;
    }

    setSaving(true);

    const res = userId
      ? await api.assignNodeOwner(node.id, { userId })
      : await api.unassignNodeOwner(node.id);

    setSaving(false);

    if (res.error) {
      notifyApiError(toast, res.error);

      return;
    }

    onSaved(res.data);
    toast.success(userId ? "Владелец назначен" : "Владелец снят");
    close();
  };

  return {
    open,
    node,
    userId,
    setUserId,
    userOptions: uniqueOptions(
      canListUsers ? [...fallback, ...users.items] : fallback,
    ),
    isLoadingUsers: users.isLoading,
    canListUsers,
    isSaving,
    openFor,
    close,
    save,
  };
};

export type AssignNodeOwnerVM = ReturnType<typeof useAssignNodeOwnerVM>;
