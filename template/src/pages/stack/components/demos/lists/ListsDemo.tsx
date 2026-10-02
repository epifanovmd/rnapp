import { Col, Segmented, SegmentedOption } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { FeedListDemo } from "./FeedListDemo";
import { SimpleListDemo } from "./SimpleListDemo";

type TListsExample = "simple" | "feed";

const EXAMPLES: SegmentedOption<TListsExample>[] = [
  { value: "simple", label: "Список · 50" },
  { value: "feed", label: "Лента · 10 000" },
];

/** Примеры AnchorList: простой список с pull-to-refresh и большая лента. */
export const ListsDemo: FC = memo(() => {
  const [example, setExample] = useState<TListsExample>("simple");

  return (
    <Col flex={1}>
      <Segmented
        options={EXAMPLES}
        value={example}
        onValueChange={setExample}
        mh={16}
        mt={12}
      />
      {example === "simple" ? <SimpleListDemo /> : <FeedListDemo />}
    </Col>
  );
});
