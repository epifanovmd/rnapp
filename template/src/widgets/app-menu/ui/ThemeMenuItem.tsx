import { useTheme } from "@shared/lib/theme";
import { ListItem, Switch } from "@shared/ui";
import React, { FC } from "react";

/** Строка меню «Тёмная тема» с переключателем. */
export const ThemeMenuItem: FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <ListItem
      icon={isDark ? "moon" : "sun"}
      title={"Тёмная тема"}
      subtitle={isDark ? "Включена" : "Выключена"}
      chevron={false}
      trailing={<Switch isActive={isDark} onChange={toggleTheme} />}
      onPress={toggleTheme}
    />
  );
};
