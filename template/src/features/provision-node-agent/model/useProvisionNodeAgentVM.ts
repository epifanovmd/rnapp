import { IAgentsStore, releaseWorkerNames } from "@entities/agent";
import { IMainApi } from "@shared/api";
import type {
  INodeInstallCommandDto,
  NodeDto,
} from "@shared/api/gen/main/model";
import { notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useEffect, useState } from "react";

import {
  DEFAULT_EXPIRES_MINUTES,
  installCommandSchema,
  sshBody,
  sshDefaults,
  sshSchema,
  type TInstallCommandValues,
  type TSshValues,
  workersBody,
} from "./validation";

/** Что делаем с агентом: ставим или удаляем. */
export type TProvisionMode = "install" | "uninstall";

/** Способ установки: команда на узле или вход сервера по SSH. */
export type TInstallWay = "command" | "ssh";

interface IUseProvisionNodeAgentOptions {
  /** Задача установки или удаления поставлена. */
  onStarted?: (jobId: string) => void;
}

/**
 * Установка и удаление агента узла. Установка — командой на узле
 * (одноразовый токен с меткой узла) или сервером по SSH; удаление — по SSH.
 * Воркеры — с сервера, по умолчанию отмечены все. SSH-данные
 * уходят в задачу один раз и в открытом виде не хранятся.
 */
export const useProvisionNodeAgentVM = ({
  onStarted,
}: IUseProvisionNodeAgentOptions = {}) => {
  const api = IMainApi.useInstance();
  const toast = INotificationService.useInstance();
  const agents = IAgentsStore.useInstance();
  const [open, setOpen] = useState(false);
  const [node, setNode] = useState<NodeDto | null>(null);
  const [mode, setMode] = useState<TProvisionMode>("install");
  const [way, setWay] = useState<TInstallWay>("command");
  const [command, setCommand] = useState<INodeInstallCommandDto | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const commandForm = useZodForm(installCommandSchema, {
    defaultValues: {
      expiresInMinutes: DEFAULT_EXPIRES_MINUTES,
      baseUrl: "",
      workers: [],
    },
  });
  const sshForm = useZodForm(sshSchema, {
    defaultValues: sshDefaults(null, []),
  });

  /** Воркеры с сервера — их можно поставить вместе с агентом. */
  const releaseWorkers = releaseWorkerNames(agents.release);
  const releaseKey = releaseWorkers.join(",");

  // Сборки пришли после открытия — отметить их воркеры, пока выбор не трогали.
  useEffect(() => {
    if (!open || !releaseKey) return;

    const names = releaseKey.split(",");

    if (!commandForm.getFieldState("workers").isDirty) {
      commandForm.setValue("workers", names);
    }
    if (!sshForm.getFieldState("workers").isDirty) {
      sshForm.setValue("workers", names);
    }
  }, [open, releaseKey, commandForm, sshForm]);

  /** `way` — способ установки; без него — по SSH, если у узла есть адрес. */
  const openFor = (
    target: NodeDto,
    nextMode: TProvisionMode = "install",
    nextWay?: TInstallWay,
  ) => {
    if (nextMode === "install") agents.loadRelease();
    setMode(nextMode);
    setWay(
      nextWay ?? (nextMode === "install" && target.host ? "ssh" : "command"),
    );
    setCommand(null);
    setJobId(null);
    commandForm.reset({
      expiresInMinutes: DEFAULT_EXPIRES_MINUTES,
      baseUrl: "",
      workers: releaseWorkers,
    });
    sshForm.reset(sshDefaults(target.host, releaseWorkers));
    setNode(target);
    setOpen(true);
  };

  const close = () => setOpen(false);

  /** Шторка закрылась: SSH-ключ, пароль и токен не остаются в памяти. */
  const onClosed = () => {
    setNode(null);
    setCommand(null);
    setJobId(null);
    sshForm.reset(sshDefaults(null, []));
  };

  const createCommand = async (data: TInstallCommandValues) => {
    if (!node) return;

    const res = await api.createNodeInstallCommand(node.id, {
      expiresInMinutes: data.expiresInMinutes,
      baseUrl: data.baseUrl || undefined,
      workers: workersBody(data.workers),
    });

    if (res.error) {
      notifyApiError(toast, res.error);

      return;
    }

    setCommand(res.data);
  };

  const submitSsh = async (data: TSshValues) => {
    if (!node) return;

    const res =
      mode === "uninstall"
        ? await api.uninstallNodeAgent(node.id, {
            ...sshBody(data),
            purge: data.purge,
          })
        : await api.installNodeAgent(node.id, {
            ...sshBody(data),
            workers: workersBody(data.workers),
          });

    if (res.error) {
      notifyApiError(toast, res.error);

      return;
    }

    setJobId(res.data.jobId);
    toast.success("Ход виден на экране узла и в задачах", {
      title: mode === "uninstall" ? "Удаление запущено" : "Установка запущена",
    });
    onStarted?.(res.data.jobId);
  };

  return {
    open,
    node,
    mode,
    way,
    setWay,
    command,
    jobId,
    commandForm,
    sshForm,
    openFor,
    close,
    onClosed,
    createCommand,
    submitSsh,
    releaseWorkers,
  };
};

export type ProvisionNodeAgentVM = ReturnType<typeof useProvisionNodeAgentVM>;
