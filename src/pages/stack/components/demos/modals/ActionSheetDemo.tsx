import { useNotifications } from "@shared/lib/notifications";
import {
  ActionSheet,
  Button,
  IActionSheetItem,
  useBottomSheetRef,
} from "@shared/ui";
import React, { FC, memo, useCallback } from "react";

type TTaskAction = "edit" | "share" | "duplicate" | "archive" | "delete";

const TASK_ACTIONS: IActionSheetItem<TTaskAction>[] = [
  { key: "edit", title: "Редактировать", icon: "edit" },
  {
    key: "share",
    title: "Поделиться",
    description: "Ссылка на задачу для участников проекта",
    icon: "share",
  },
  { key: "duplicate", title: "Дублировать", icon: "copy" },
  {
    key: "archive",
    title: "В архив",
    description: "Недоступно для задач в работе",
    icon: "save",
    disabled: true,
  },
  { key: "delete", title: "Удалить", icon: "trash", destructive: true },
];

/** ActionSheet: заголовок, иконки, описания, недоступный и опасный пункты. */
export const ActionSheetDemo: FC = memo(() => {
  const sheetRef = useBottomSheetRef();
  const toast = useNotifications();

  const onSelect = useCallback(
    (key: TTaskAction) => {
      const item = TASK_ACTIONS.find(action => action.key === key);

      toast.info(`Выбрано: ${item?.title ?? key}`);
    },
    [toast],
  );

  return (
    <>
      <Button
        title={"Действия с задачей"}
        onPress={() => sheetRef.current?.present()}
      />
      <ActionSheet<TTaskAction>
        ref={sheetRef}
        title={"Задача «Релиз 2.4»"}
        items={TASK_ACTIONS}
        onSelect={onSelect}
      />
    </>
  );
});
