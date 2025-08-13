import { RouteProp, useRoute as _useRoute } from "@react-navigation/native";

import { ScreenParamList } from "../navigation.types";

export const useRoute = () => _useRoute<RouteProp<ScreenParamList>>();
