import { GroupedSelect, Select } from "@shared/ui";
import React, { FC, memo, useMemo, useState } from "react";

import { FRUIT_GROUPS } from "./select-demo-api";

/** Группы: Select с `groups` + плоским `options` и GroupedSelect. */
export const SelectGroupsDemo: FC = memo(() => {
  const [single, setSingle] = useState<string | null>("pear");
  const [many, setMany] = useState<string[]>([]);
  const options = useMemo(
    () => FRUIT_GROUPS.flatMap(group => group.options),
    [],
  );

  return (
    <>
      <Select
        clearable
        search
        label={"Select + groups"}
        options={options}
        groups={FRUIT_GROUPS}
        value={single}
        onChange={setSingle}
      />
      <GroupedSelect<string>
        multi
        clearable
        label={"GroupedSelect (multi)"}
        groups={FRUIT_GROUPS}
        value={many}
        onChange={setMany}
      />
    </>
  );
});
