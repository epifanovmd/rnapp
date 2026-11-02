import { GroupedSelect, Select } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { MANY_GROUPS, MANY_OPTIONS } from "./select-demo-api";

/** virtual: 1000 вариантов на AnchorList, поиск, прилипающие группы. */
export const SelectVirtualDemo: FC = memo(() => {
  const [value, setValue] = useState<number | null>(500);
  const [many, setMany] = useState<number[]>([]);

  return (
    <>
      <Select<number>
        virtual
        search
        clearable
        label={"1000 вариантов"}
        options={MANY_OPTIONS}
        value={value}
        onChange={setValue}
      />
      <GroupedSelect<number>
        virtual
        multi
        clearable
        search
        maxTagCount={4}
        label={"1000 вариантов по группам (multi)"}
        groups={MANY_GROUPS}
        value={many}
        onChange={setMany}
      />
    </>
  );
});
