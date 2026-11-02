import { Button, IButtonProps, useConfirm } from "@shared/ui";
import React, { FC, useCallback } from "react";

import { useSignOut } from "../model/useSignOut";

export type TSignOutButtonProps = Omit<
  IButtonProps,
  "onPress" | "title" | "children"
>;

/** Кнопка выхода из аккаунта с подтверждением. */
export const SignOutButton: FC<TSignOutButtonProps> = ({
  variant = "danger",
  appearance = "outline",
  leftIcon = "logOut",
  ...props
}) => {
  const signOut = useSignOut();
  const confirm = useConfirm();

  const handlePress = useCallback(async () => {
    const confirmed = await confirm({
      title: "Выйти из аккаунта?",
      confirmLabel: "Выйти",
      confirmVariant: "destructive",
    });

    if (confirmed) signOut();
  }, [confirm, signOut]);

  return (
    <Button
      variant={variant}
      appearance={appearance}
      leftIcon={leftIcon}
      title={"Выйти"}
      onPress={handlePress}
      {...props}
    />
  );
};
