import { Autocomplete, useAsyncOptions, useStaticOptions } from "@shared/ui";
import React, { FC, memo, useMemo, useState } from "react";

import { CITY_OPTIONS } from "./demo-form-schema";
import { DOMAIN_OPTIONS, searchUsers } from "./select-demo-api";

/** Autocomplete: свободный ввод с подсказками — клиентскими и серверными. */
export const AutocompleteDemo: FC = memo(() => {
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("");

  const cities = useStaticOptions(CITY_OPTIONS, { search: true });
  const domains = useMemo(() => {
    const [name, domain = ""] = email.split("@");

    if (!name || !email.includes("@")) return [];

    return DOMAIN_OPTIONS.filter(option =>
      option.value.startsWith(domain.toLowerCase()),
    ).map(option => ({
      value: `${name}@${option.value}`,
      label: `${name}@${option.value}`,
    }));
  }, [email]);
  const users = useAsyncOptions({
    fetch: searchUsers,
    getOption: item => ({ value: item.name, label: item.name }),
    minQueryLength: 2,
  });

  return (
    <>
      <Autocomplete
        label={"Город"}
        placeholder={"Начните вводить"}
        options={cities.options}
        onSearch={cities.onSearch}
        value={city}
        onChange={setCity}
      />
      <Autocomplete
        label={"Email"}
        description={"Подсказки доменов после «@»"}
        placeholder={"name@domain"}
        options={domains}
        value={email}
        onChange={setEmail}
        inputProps={{ keyboardType: "email-address", autoCapitalize: "none" }}
      />
      <Autocomplete
        {...users}
        label={"Пользователь (сервер, от 2 символов)"}
        value={user}
        onChange={setUser}
      />
    </>
  );
});
