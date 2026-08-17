import { Text } from "@shared/ui";
import React, { FC, memo } from "react";

export const ScanSectionTitle: FC<{ title: string }> = memo(({ title }) => (
  <Text mt={16} textStyle={"Title_S1"}>
    {title}
  </Text>
));
