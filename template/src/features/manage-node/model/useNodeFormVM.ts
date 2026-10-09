import { IMainApi } from "@shared/api";
import type { NodeDto } from "@shared/api/gen/main/model";
import { notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useState } from "react";

import {
  EMPTY_NODE_FORM,
  nodeFormBody,
  nodeFormSchema,
  nodeFormValues,
  type TNodeFormValues,
} from "./validation";

interface IUseNodeFormOptions {
  onSaved: (node: NodeDto) => void;
}

/** Создание и изменение узла: название, адрес, описание. */
export const useNodeFormVM = ({ onSaved }: IUseNodeFormOptions) => {
  const api = IMainApi.useInstance();
  const toast = INotificationService.useInstance();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NodeDto | null>(null);
  const form = useZodForm(nodeFormSchema, { defaultValues: EMPTY_NODE_FORM });

  const openCreate = () => {
    setEditing(null);
    form.reset(EMPTY_NODE_FORM);
    setOpen(true);
  };

  const openEdit = (node: NodeDto) => {
    setEditing(node);
    form.reset(nodeFormValues(node));
    setOpen(true);
  };

  const submit = async (data: TNodeFormValues) => {
    const body = nodeFormBody(data);
    const res = editing
      ? await api.updateNode(editing.id, body)
      : await api.createNode(body);

    if (res.error) {
      notifyApiError(toast, res.error);

      return;
    }

    onSaved(res.data);
    toast.success(editing ? "Узел сохранён" : `Узел «${res.data.name}» создан`);
    setOpen(false);
  };

  return { open, setOpen, openCreate, openEdit, editing, form, submit };
};

export type NodeFormVM = ReturnType<typeof useNodeFormVM>;
