import { Path, Skia, SkPath } from "@shopify/react-native-skia";
import React, { FC } from "react";
import { DerivedValue, useDerivedValue } from "react-native-reanimated";

interface NavigatorLineProps {
  index: number;
  paths: DerivedValue<SkPath[]>;
  color: string;
}

/** Линия серии в навигаторе — путь по индексу из общего derived-массива. */
export const NavigatorLine: FC<NavigatorLineProps> = ({
  index,
  paths,
  color,
}) => {
  const path = useDerivedValue(
    () => paths.value[index] ?? Skia.PathBuilder.Make().detach(),
    [paths, index],
  );

  return (
    <Path
      path={path}
      style={"stroke"}
      strokeWidth={1}
      color={color}
      opacity={0.7}
    />
  );
};
