import { Select, useDependentOptions } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { cityToOption, COUNTRY_OPTIONS, fetchCities } from "./select-demo-api";

/** useDependentOptions: список городов перезагружается при смене страны. */
export const SelectDependentDemo: FC = memo(() => {
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const cities = useDependentOptions({
    dependsOn: country,
    fetch: fetchCities,
    getOption: cityToOption,
    search: true,
  });

  return (
    <>
      <Select
        clearable
        label={"Страна"}
        options={COUNTRY_OPTIONS}
        value={country}
        onChange={next => {
          setCountry(next);
          setCity(null);
        }}
      />
      <Select
        {...cities}
        clearable
        label={"Город"}
        placeholder={country ? "Не выбран" : "Сначала страна"}
        disabled={!country}
        value={city}
        onChange={setCity}
      />
    </>
  );
});
