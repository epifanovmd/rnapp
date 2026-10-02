import { Select, useInfiniteOptions } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { fetchUsersPage, userToOption } from "./select-demo-api";

/** useInfiniteOptions: серверный поиск + догрузка страниц у конца списка. */
export const SelectInfiniteDemo: FC = memo(() => {
  const [users, setUsers] = useState<number[]>([]);
  const [virtualUsers, setVirtualUsers] = useState<number[]>([]);
  const data = useInfiniteOptions({
    fetchPage: fetchUsersPage,
    getOption: userToOption,
  });
  const virtualData = useInfiniteOptions({
    fetchPage: fetchUsersPage,
    getOption: userToOption,
  });

  return (
    <>
      <Select<number>
        {...data}
        multi
        clearable
        maxTagCount={3}
        label={"Пользователи (infinite)"}
        value={users}
        onChange={setUsers}
      />
      <Select<number>
        {...virtualData}
        multi
        clearable
        virtual
        maxTagCount={3}
        label={"Пользователи (infinite + virtual)"}
        value={virtualUsers}
        onChange={setVirtualUsers}
      />
    </>
  );
});
