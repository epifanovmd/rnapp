import { memo, PropsWithChildren } from "react";
import { View } from "react-native";

export interface IHiddenNavBarProps {}

export const HiddenNavBar = memo<PropsWithChildren<IHiddenNavBarProps>>(() => {
  return <View></View>;
});
