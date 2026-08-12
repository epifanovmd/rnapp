import type { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";

/** Param list вложенного top-tab навигатора плейграунда компонентов. */
export type ComponentsTabsParamList = {
  Buttons: undefined;
  Notifications: undefined;
  Modals: undefined;
  Dialogs: undefined;
  Pickers: undefined;
  Elements: undefined;
  Ticket: undefined;
};

export type ComponentsTabName = keyof ComponentsTabsParamList;

export type ComponentsTabProps<
  Name extends ComponentsTabName = ComponentsTabName,
> = MaterialTopTabScreenProps<ComponentsTabsParamList, Name>;
