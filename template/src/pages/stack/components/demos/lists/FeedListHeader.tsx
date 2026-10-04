import { Col, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import { FEED_SIZE } from "./feed-data";

interface IFeedListHeaderProps {
  /** Название списка, на котором построена лента. */
  list: string;
}

/** Шапка ленты на непрозрачном фоне: список и объём данных. */
export const FeedListHeader: FC<IFeedListHeaderProps> = memo(({ list }) => (
  <Col bg={"background"} ph={16} pt={8} pb={12}>
    <Text textStyle={"Body_M1"} color={"textSecondary"}>
      {`${list} · ${FEED_SIZE.toLocaleString("ru-RU")} постов разной высоты`}
    </Text>
  </Col>
));
