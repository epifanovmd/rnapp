import { useNotifications } from "@shared/lib/notifications";
import { Button, useConfirm } from "@shared/ui";
import React, { FC, memo } from "react";

/** Кнопка → системный confirm → тост с результатом. */
export const ConfirmDemo: FC = memo(() => {
  const confirm = useConfirm();
  const toast = useNotifications();

  const onPress = async () => {
    const confirmed = await confirm({
      title: "Удалить проект?",
      description: "Действие нельзя отменить",
      confirmLabel: "Удалить",
      confirmVariant: "destructive",
    });

    if (confirmed) {
      toast.success("Проект удалён");
    } else {
      toast.info("Отменено");
    }
  };

  return (
    <Button
      title={"Удалить проект"}
      variant={"danger"}
      appearance={"outline"}
      leftIcon={"trash"}
      onPress={onPress}
    />
  );
});
