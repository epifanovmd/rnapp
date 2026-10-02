import { Button, useCarousel } from "@shared/ui";
import React, { FC } from "react";

export const RandomSlideButton: FC = () => {
  const { count, scrollTo } = useCarousel();

  return (
    <Button
      mt={8}
      size={"small"}
      appearance={"outline"}
      title={"К случайному слайду"}
      onPress={() => scrollTo(Math.floor(Math.random() * count))}
    />
  );
};
