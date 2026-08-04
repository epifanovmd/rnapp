import { IInputBarLayout, INPUT_BAR_DEFAULT_LAYOUT } from "../../input-bar";
import { ChatLayoutConfig } from "../types";
import { CHAT_DEFAULT_LAYOUT, IChatLayout } from "./chat-layout";

/**
 * Разбор пропа `layout` на метрики чата и панели ввода.
 *
 * Проп плоский — раскладывается по совпадению имён и примитивных типов
 * с дефолтными значениями. Объектные поля (шрифты) не переопределяются.
 */

export interface IResolvedChatLayout {
  chat: IChatLayout;
  inputBar: IInputBarLayout;
}

const DEFAULTS: IResolvedChatLayout = {
  chat: CHAT_DEFAULT_LAYOUT,
  inputBar: INPUT_BAR_DEFAULT_LAYOUT,
};

/**
 * Копия дефолтов с переопределением совпадающих по имени и типу ключей.
 * Шрифты и прочие объекты не переопределяются: проп числовой.
 */
const override = <T extends object>(
  defaults: T,
  source: Record<string, unknown>,
): T => {
  let result: T | undefined;

  for (const key of Object.keys(defaults) as (keyof T & string)[]) {
    const value = source[key];
    const fallback = defaults[key];

    if (value === undefined || typeof value !== typeof fallback) continue;
    if (typeof value !== "number" && typeof value !== "string") continue;

    result ??= { ...defaults };
    result[key] = value as T[keyof T & string];
  }

  return result ?? defaults;
};

export const resolveChatLayout = (
  config: ChatLayoutConfig | undefined,
): IResolvedChatLayout => {
  if (!config) return DEFAULTS;

  const source = config as Record<string, unknown>;

  return {
    chat: override(CHAT_DEFAULT_LAYOUT, source),
    inputBar: override(INPUT_BAR_DEFAULT_LAYOUT, source),
  };
};
