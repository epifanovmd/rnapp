import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";

import { Skeleton } from "../skeleton";

/**
 * Стандартный скелетон загрузки: пульсирующая заливка на всю площадь.
 * Форму (радиус) задаёт контейнер Image — он обрезает содержимое.
 */
export const ImageSkeleton: FC = memo(() => (
  <Skeleton borderRadius={0} style={StyleSheet.absoluteFill} />
));
