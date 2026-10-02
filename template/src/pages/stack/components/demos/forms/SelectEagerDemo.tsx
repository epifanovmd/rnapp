import {
  Button,
  Select,
  useControlledOptions,
  useEagerOptions,
} from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { fetchAllUsers, IDemoUser, userToOption } from "./select-demo-api";

/**
 * useEagerOptions — весь список одним запросом при монтировании, поиск на
 * клиенте; useControlledOptions — данные и loading снаружи, хук маппит и ищет.
 */
export const SelectEagerDemo: FC = memo(() => {
  const [eager, setEager] = useState<number | null>(null);
  const [controlled, setControlled] = useState<number | null>(null);
  const [data, setData] = useState<IDemoUser[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const eagerData = useEagerOptions({
    fetch: fetchAllUsers,
    getOption: userToOption,
    search: true,
  });
  const controlledData = useControlledOptions({
    data,
    loading,
    getOption: userToOption,
    search: true,
    filterOption: (query, option) =>
      `${String(option.label)} ${option.description ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  });

  const load = () => {
    setLoading(true);
    const controller = new AbortController();

    fetchAllUsers(controller.signal)
      .then(users => setData(users.slice(0, 30)))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Select<number>
        {...eagerData}
        clearable
        label={"Пользователи (eager, 200)"}
        value={eager}
        onChange={setEager}
      />
      <Button
        size={"small"}
        appearance={"outline"}
        title={"Загрузить данные для controlled"}
        onPress={load}
      />
      <Select<number>
        {...controlledData}
        clearable
        label={"Controlled (поиск и по email)"}
        value={controlled}
        onChange={setControlled}
      />
    </>
  );
});
