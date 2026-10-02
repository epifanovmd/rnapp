import { Section, Text } from "@shared/ui";
import React, { FC, PropsWithChildren } from "react";

interface IAppMenuGroupProps {
  label: string;
}

/** Группа пунктов меню: заголовок над пунктами, выровненный по их иконкам. */
export const AppMenuGroup: FC<PropsWithChildren<IAppMenuGroupProps>> = ({
  label,
  children,
}) => (
  <Section pa={8} gap={4}>
    <Text textStyle={"Title_S1"} ph={8} pt={8} pb={4}>
      {label}
    </Text>
    {children}
  </Section>
);
