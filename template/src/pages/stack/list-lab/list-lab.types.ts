import type { StackScreenProps } from "@react-navigation/stack";

/** Param list вложенного навигатора стендов списка. */
export type ListLabParamList = {
  Hub: undefined;
  InitialPosition: undefined;
  Pagination: undefined;
  Mvcp: undefined;
  InputBarInset: undefined;
  Sticky: undefined;
};

export type ListLabScreenName = keyof ListLabParamList;

export type ListLabScreenProps<
  Name extends ListLabScreenName = ListLabScreenName,
> = StackScreenProps<ListLabParamList, Name>;
