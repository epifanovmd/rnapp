import { IAgentsStore, releaseWorkerNames } from "@entities/agent";
import { IMainApi } from "@shared/api";
import type { AgentEnrollmentTokenDto } from "@shared/api/gen/main/model";
import { useCollection } from "@shared/lib/holders";
import { notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { useConfirm, useZodForm } from "@shared/ui";
import { useState } from "react";

import {
  enrollmentTokenSchema,
  INSTALL_DEFAULTS,
  installCommandBody,
  installCommandSchema,
  type TEnrollmentTokenValues,
  type TInstallCommandValues,
  TOKEN_DEFAULTS,
  tokenExpiresAt,
} from "./validation";

/** Токенов в списке — не больше (сервер отдаёт до 100 за раз). */
const TOKENS_LIMIT = 100;

/**
 * Установка агента: токены регистрации (выпуск, список, отзыв) и команда
 * установки на узел. Полный токен сервер отдаёт один раз — он сразу
 * подставляется в команду и уходит из памяти с закрытием шторки.
 */
export const useEnrollAgentVM = () => {
  const api = IMainApi.useInstance();
  const toast = INotificationService.useInstance();
  const agents = IAgentsStore.useInstance();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const [command, setCommand] = useState<string | null>(null);

  const tokens = useCollection<AgentEnrollmentTokenDto>({
    queryFn: async () => {
      const { data, error } = await api.getAgentEnrollmentTokens({
        limit: TOKENS_LIMIT,
      });

      return { data: data?.items ?? null, error };
    },
    keyExtractor: token => token.id,
    autoLoad: true,
    enabled: open,
  });

  const tokenForm = useZodForm(enrollmentTokenSchema, {
    defaultValues: TOKEN_DEFAULTS,
  });
  const installForm = useZodForm(installCommandSchema, {
    defaultValues: INSTALL_DEFAULTS,
  });

  const openDialog = () => {
    tokenForm.reset(TOKEN_DEFAULTS);
    installForm.reset(INSTALL_DEFAULTS);
    setIssued(null);
    setCommand(null);
    setOpen(true);
    agents.loadRelease();
  };

  /** Шторка закрылась: выпущенный токен и команда не остаются в памяти. */
  const onClosed = () => {
    setIssued(null);
    setCommand(null);
    installForm.reset(INSTALL_DEFAULTS);
  };

  const createToken = async (values: TEnrollmentTokenValues) => {
    const res = await api.createAgentEnrollmentToken({
      name: values.name,
      labels: values.labels,
      maxUses: values.singleUse ? 1 : undefined,
      expiresAt: tokenExpiresAt(values.expiry),
    });

    if (res.error) {
      notifyApiError(toast, res.error);

      return;
    }

    tokens.prependItem(res.data.enrollmentToken);
    setIssued(res.data.token);
    installForm.setValue("token", res.data.token);
    installForm.setValue("tokenFile", "");
    tokenForm.reset(TOKEN_DEFAULTS);
  };

  const revokeToken = async (token: AgentEnrollmentTokenDto) => {
    const ok = await confirm({
      title: `Отозвать токен «${token.name}»?`,
      description:
        "Новые агенты не смогут зарегистрироваться с ним. Уже зарегистрированные продолжат работать.",
      confirmLabel: "Отозвать",
      confirmVariant: "destructive",
    });

    if (!ok) return;

    const res = await api.revokeAgentEnrollmentToken(token.id);

    if (res.error) {
      notifyApiError(toast, res.error);

      return;
    }

    tokens.updateItem(token.id, {
      ...token,
      revokedAt: new Date().toISOString(),
    });
  };

  const createCommand = async (values: TInstallCommandValues) => {
    const res = await api.createAgentInstallCommand(installCommandBody(values));

    if (res.error) {
      notifyApiError(toast, res.error);

      return;
    }

    setCommand(res.data.command);
  };

  return {
    open,
    setOpen,
    openDialog,
    onClosed,
    tokens: tokens.items,
    isTokensLoading: tokens.isLoading,
    tokenForm,
    createToken,
    revokeToken,
    /** Выпущенный токен: показывается один раз, до закрытия шторки. */
    issued,
    installForm,
    createCommand,
    /** Готовая команда установки. */
    command,
    /** Воркеры из выпуска — их можно поставить вместе с агентом. */
    releaseWorkers: releaseWorkerNames(agents.release),
  };
};

export type EnrollAgentVM = ReturnType<typeof useEnrollAgentVM>;
