import { parseJsonText } from "@entities/agent";
import { IMainApi } from "@shared/api";
import type { IAgentConfigEntryDto } from "@shared/api/gen/main/model";
import { getErrorBody, notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { useConfirm, useZodForm } from "@shared/ui";
import { useState } from "react";

import { initialConfigText, invalidConfigText } from "./config-text";
import type { IWorkerConfigTarget } from "./types";
import { type TWorkerConfigForm, workerConfigSchema } from "./validation";

/** Код ошибки сервера: значение не подходит под схему ключа. */
const CONFIG_INVALID = "AGENT_CONFIG_INVALID";

interface IUseWorkerConfigEditorOptions {
  /** Сервер принял новую версию. */
  onSaved?: (entry: IAgentConfigEntryDto) => void;
  /** Ключ удалён (агент ещё удаляет его у себя). */
  onDeleted?: (target: IWorkerConfigTarget) => void;
}

/**
 * Настройка воркера: JSON-значение ключа с подсказкой по схеме из манифеста,
 * запись новой версии и удаление ключа. Значение по схеме проверяет сервер —
 * его ответ показывается у поля.
 */
export const useWorkerConfigEditorVM = ({
  onSaved,
  onDeleted,
}: IUseWorkerConfigEditorOptions = {}) => {
  const api = IMainApi.useInstance();
  const toast = INotificationService.useInstance();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<IWorkerConfigTarget | null>(null);
  const form = useZodForm(workerConfigSchema, {
    defaultValues: { value: "" },
  });

  const openFor = (next: IWorkerConfigTarget) => {
    form.reset({ value: initialConfigText(next) });
    setTarget(next);
    setOpen(true);
  };

  const close = () => setOpen(false);

  /** Шторка закрылась: значение не остаётся в форме. */
  const onClosed = () => {
    setTarget(null);
    form.reset({ value: "" });
  };

  const save = async ({ value }: TWorkerConfigForm) => {
    const parsed = parseJsonText(value);

    if (!target || !("value" in parsed)) return;

    const res = await api.setAgentWorkerConfig(
      target.agentId,
      target.worker,
      target.key,
      { data: parsed.value },
    );

    if (res.error) {
      if (res.error.code === CONFIG_INVALID) {
        form.setError("value", {
          message: invalidConfigText(
            res.error.message,
            getErrorBody(res.error),
          ),
        });
      } else {
        notifyApiError(toast, res.error);
      }

      return;
    }

    toast.success(
      `${target.worker}/${target.key}: версия ${res.data.status.version ?? "—"} задана`,
    );
    onSaved?.(res.data);
    setOpen(false);
  };

  const remove = async (item: IWorkerConfigTarget) => {
    const ok = await confirm({
      title: `Удалить настройку «${item.worker}/${item.key}»?`,
      description:
        "Агент удалит ключ у себя и у воркера. Воркер продолжит работать без этой настройки.",
      confirmLabel: "Удалить",
      confirmVariant: "destructive",
    });

    if (!ok) return;

    const res = await api.deleteAgentWorkerConfig(
      item.agentId,
      item.worker,
      item.key,
    );

    if (res.error) {
      notifyApiError(toast, res.error);

      return;
    }

    toast.success(`Настройка «${item.worker}/${item.key}» удалена`);
    onDeleted?.(item);
    if (target?.key === item.key && target.worker === item.worker) {
      setOpen(false);
    }
  };

  return { open, target, form, openFor, close, onClosed, save, remove };
};

export type WorkerConfigEditorVM = ReturnType<typeof useWorkerConfigEditorVM>;
