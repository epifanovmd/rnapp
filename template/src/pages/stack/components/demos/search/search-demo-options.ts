import type { TSearchCancelMode } from "@shared/ui";

/** Когда показывать оверлей: никогда, весь режим поиска, только без запроса. */
export type TSearchOverlayMode = "none" | "active" | "empty";

export interface ISearchHiddenBarOptions {
  overlay: TSearchOverlayMode;
  hideBar: boolean;
  restore: "previous" | "show";
  cancel: TSearchCancelMode;
}

export const DEFAULT_HIDDEN_BAR_OPTIONS: ISearchHiddenBarOptions = {
  overlay: "empty",
  hideBar: true,
  restore: "previous",
  cancel: "active",
};

/** Показан ли оверлей при текущем режиме поиска и запросе. */
export const isOverlayVisible = (
  mode: TSearchOverlayMode,
  active: boolean,
  query: string,
): boolean =>
  active && (mode === "active" || (mode === "empty" && !query));
