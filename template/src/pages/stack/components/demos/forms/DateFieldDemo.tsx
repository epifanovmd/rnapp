import { DateField } from "@shared/ui";
import { addDays, startOfToday } from "date-fns";
import React, { FC, memo, useMemo, useState } from "react";

/** DateField без формы: обычный, с границами и форматом, без сброса, disabled. */
export const DateFieldDemo: FC = memo(() => {
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(() =>
    addDays(startOfToday(), 7),
  );
  const [required, setRequired] = useState<Date | null>(() => new Date());
  const today = useMemo(() => startOfToday(), []);
  const maxDeadline = useMemo(() => addDays(today, 90), [today]);

  return (
    <>
      <DateField
        label={"Дата рождения"}
        placeholder={"Выберите дату"}
        value={birthDate}
        onChange={setBirthDate}
        maxDate={today}
      />
      <DateField
        label={"Дедлайн"}
        description={"От сегодня до +90 дней; формат dd.MM.yyyy"}
        value={deadline}
        onChange={setDeadline}
        minDate={today}
        maxDate={maxDeadline}
        format={"dd.MM.yyyy"}
      />
      <DateField
        label={"Без сброса"}
        value={required}
        onChange={setRequired}
        clearable={false}
      />
      <DateField
        label={"Disabled"}
        value={required}
        onChange={setRequired}
        disabled
      />
    </>
  );
});
