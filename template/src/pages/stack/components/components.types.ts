import type { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";

/** Param list вложенного top-tab навигатора плейграунда компонентов. */
export type ComponentsTabsParamList = {
  Buttons: undefined;
  Typography: undefined;
  Icons: undefined;
  Inputs: undefined;
  Controls: undefined;
  Layout: undefined;
  Feedback: undefined;
  Media: undefined;
  Notifications: undefined;
  Modals: undefined;
  Dialogs: undefined;
  Pickers: undefined;
  Ticket: undefined;
};

export type ComponentsTabName = keyof ComponentsTabsParamList;

export type ComponentsTabProps<
  Name extends ComponentsTabName = ComponentsTabName,
> = MaterialTopTabScreenProps<ComponentsTabsParamList, Name>;
