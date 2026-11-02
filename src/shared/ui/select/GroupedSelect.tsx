import React, { Ref, useMemo } from "react";

import { Select } from "./Select";
import type {
  GroupedSelectProps,
  SelectProps,
  SelectRef,
  SelectValue,
} from "./types";

/** Select со сгруппированными опциями: `groups` + плоский `options`. */
export const GroupedSelect = <V extends SelectValue = string>({
  groups,
  ...rest
}: GroupedSelectProps<V> & { ref?: Ref<SelectRef> }) => {
  const options = useMemo(
    () => groups.flatMap(group => group.options),
    [groups],
  );

  return (
    <Select<V>
      {...(rest as SelectProps<V>)}
      options={options}
      groups={groups}
    />
  );
};
