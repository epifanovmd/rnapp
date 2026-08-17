import { Button } from "@shared/ui";
import { FC } from "react";

import { useSignOut } from "../model/useSignOut";

export const SignOutButton: FC = () => {
  const signOut = useSignOut();

  return (
    <Button color={"danger"} appearance={"ghost"} onPress={signOut}>
      {"Выйти"}
    </Button>
  );
};
