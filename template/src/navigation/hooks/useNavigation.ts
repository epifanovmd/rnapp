import {
  NavigationProp,
  useNavigation as _useNavigation,
} from "@react-navigation/native";

import { ScreenParamList } from "../navigation.types";

export const useNavigation = () =>
  _useNavigation<NavigationProp<ScreenParamList>>();
