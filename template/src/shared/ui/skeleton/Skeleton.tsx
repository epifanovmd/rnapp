import React, { FC, memo } from "react";

import { ISkeletonProps, SkeletonBase } from "./SkeletonBase";
import { SkeletonGroup } from "./SkeletonGroup";
import { SkeletonText } from "./SkeletonText";

export interface ISkeletonCircleProps extends Omit<
  ISkeletonProps,
  "circle" | "width" | "height"
> {
  size?: number;
}

/** Круглая заглушка (аватар, иконка). */
const SkeletonCircle: FC<ISkeletonCircleProps> = memo(
  ({ size = 40, ...rest }) => <SkeletonBase circle width={size} {...rest} />,
);

/**
 * Скелетоны загрузки. Композиция произвольных макетов:
 * - `Skeleton` — блок любой формы (width/height/borderRadius/circle + style);
 * - `Skeleton.Circle` — круг по size;
 * - `Skeleton.Text` — многострочный абзац;
 * - `Skeleton.Group` — синхронный пульс всех вложенных блоков.
 */
export const Skeleton = Object.assign(SkeletonBase, {
  Circle: SkeletonCircle,
  Text: SkeletonText,
  Group: SkeletonGroup,
});
