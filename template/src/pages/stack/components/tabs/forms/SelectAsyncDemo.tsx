import { Select, useAsyncOptions } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { searchUsers, userToOption } from "./select-demo-api";

/** useAsyncOptions: серверный поиск по открытию и вводу (debounce). */
export const SelectAsyncDemo: FC = memo(() => {
  const [user, setUser] = useState<number | null>(null);
  const data = useAsyncOptions({
    fetch: searchUsers,
    getOption: userToOption,
    loadOnce: true,
  });

  return (
    <Select<number>
      {...data}
      clearable
      label={"Пользователь (async)"}
      description={"Подпись выбранного помнится, даже если его нет в выдаче"}
      value={user}
      onChange={setUser}
    />
  );
});
