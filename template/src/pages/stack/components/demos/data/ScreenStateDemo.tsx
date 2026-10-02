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
          icon: "briefcase",
          title: "Проектов нет",
          description: "Создайте первый проект",
        }}
      >
        <ListItem title={"Atlas"} subtitle={"12 задач"} icon={"briefcase"} />
      </ScreenState>
    </>
  );
});
