import { useHolderRef } from "@shared/lib/holders";
import { useEvent } from "@shared/lib/hooks";
import { useEffect } from "react";

import { AgentEventFeed, type AgentEventPageFetcher } from "./agent-event-feed";

/**
 * Лента событий воркеров; перезагружается при смене `key` (агент, фильтр).
 * `key: null` — не загружать.
 */
export const useAgentEventFeed = (
  fetch: AgentEventPageFetcher,
  key: string | null,
) => {
  const fetchLatest = useEvent(fetch);
  const feed = useHolderRef(() => new AgentEventFeed(fetchLatest));

  useEffect(() => {
    if (key !== null) feed.load();
  }, [feed, key]);

  return feed;
};
