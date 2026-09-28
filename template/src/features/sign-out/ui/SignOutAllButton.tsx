import { Button } from "@shared/ui";
import { FC } from "react";

import { useSignOutAll } from "../model/useSignOutAll";

export const SignOutAllButton: FC = () => {
  const { signOutAll, isLoading } = useSignOutAll();

  return (
    <Button
      size={"small"}
      variant={"danger"}
      appearance={"outline"}
      loading={isLoading}
      onPress={signOutAll}
    >
      {"Выйти на всех устройствах"}
    </Button>
  );
};
