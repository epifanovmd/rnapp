import { Avatar, HighlightText, ListItem } from "@shared/ui";
import React, { FC, memo } from "react";

import type { ISearchDemoContact } from "./search-demo-data";

interface ISearchDemoRowProps {
  contact: ISearchDemoContact;
  query: string;
  onPress?: (contact: ISearchDemoContact) => void;
}

/** Контакт: аватар, имя и «должность · город» с подсветкой запроса. */
export const SearchDemoRow: FC<ISearchDemoRowProps> = memo(
  ({ contact, query, onPress }) => (
    <ListItem
      leading={<Avatar size={40} name={contact.name} />}
      title={
        <HighlightText
          textStyle={"Title_S2"}
          numberOfLines={1}
          text={contact.name}
          query={query}
        />
      }
      subtitle={
        <HighlightText
          textStyle={"Caption_M3"}
          color={"textSecondary"}
          numberOfLines={1}
          text={`${contact.role} · ${contact.city}`}
          query={query}
        />
      }
      onPress={onPress ? () => onPress(contact) : undefined}
    />
  ),
);
