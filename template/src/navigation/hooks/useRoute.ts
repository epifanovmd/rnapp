import { RouteProp } from "@react-navigation/core/lib/typescript/src/types";
import { useRoute as _useRoute } from "@react-navigation/native";

import { ScreenParamList } from "../navigation.types";

export const useRoute = () => _useRoute<RouteProp<ScreenParamList>>();
