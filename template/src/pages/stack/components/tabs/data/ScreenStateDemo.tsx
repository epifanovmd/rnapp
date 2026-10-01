import { ListItem, ScreenState, Segmented } from "@shared/ui";
import React, { FC, memo, useState } from "react";

type TDemoState = "loading" | "error" | "empty" | "content";

const STATES: { label: string; value: TDemoState }[] = [
  { label: "Загрузка", value: "loading" },
  { label: "Ошибка", value: "error" },
  { label: "Пусто", value: "empty" },
  { label: "Контент", value: "content" },
];

/** Переключатель состояний ScreenState: загрузка → ошибка → пусто → контент. */
export const ScreenStateDemo: FC = memo(() => {
  const [state, setState] = useState<TDemoState>("loading");

  return (
    <>
      <Segmented options={STATES} value={state} onValueChange={setState} />
      <ScreenState
        isLoading={state === "loading"}
        error={state === "error" ? "Сервер недоступен" : null}
        onRetry={() => setState("loading")}
        isEmpty={state === "empty" || state === "loading"}
        empty={{
          icon: "server",
          title: "Серверов нет",
          description: "Добавьте первый сервер",
        }}
      >
        <ListItem title={"srv-01"} subtitle={"10.0.0.1"} icon={"server"} />
      </ScreenState>
    </>
  );
});
