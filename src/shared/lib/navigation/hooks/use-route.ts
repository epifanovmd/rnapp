import { RouteProp, useRoute as useRouteBase } from "@react-navigation/native";

import { RootParamList, RouteName } from "../navigation.types";

/** Текущий маршрут; для доступа к params сузить: `useRoute<"PdfView">()`. */
export const useRoute = <Name extends RouteName = RouteName>() =>
  useRouteBase<RouteProp<RootParamList, Name>>();
