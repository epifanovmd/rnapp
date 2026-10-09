import type { AgentDto } from "@shared/api/gen/main/model";
import { createContext, ReactNode, useContext } from "react";

import type { IAgentTabsAccess } from "./types";

export interface IAgentTabsContext {
  /** Агент; нет (не установлен, не загружен) — только вкладка «Обзор». */
  agent: AgentDto | null;
  access: IAgentTabsAccess;
  /** Шапка над переключателем вкладок: навбар и карточка экрана. */
  header: ReactNode;
  /** Начало вкладки «Обзор»: что показывает экран до метрик агента. */
  overview: ReactNode;
  /** Pull-to-refresh вкладок. */
  onRefresh?: () => Promise<unknown>;
}

export const AgentTabsContext = createContext<IAgentTabsContext | null>(null);

/** Агент, права и части экрана для вкладок и шапки. */
export const useAgentTabs = (): IAgentTabsContext => {
  const context = useContext(AgentTabsContext);

  if (!context) {
    throw new Error("useAgentTabs must be used within AgentTabsContext");
  }

  return context;
};
