import React, { FC, memo } from "react";

import { Text } from "../text";
import { ITouchableProps, Touchable } from "../touchable";

export interface ISectionActionProps extends Omit<ITouchableProps, "children"> {
  title: string;
}

/** Ссылка-действие в заголовке секции («Все», «Изменить»). */
export const SectionAction: FC<ISectionActionProps> = memo(
  ({ title, ...rest }) => (
    <Touchable hitSlop={8} accessibilityRole={"button"} {...rest}>
      <Text textStyle={"Body_S1"} color={"primary"}>
        {title}
      </Text>
    </Touchable>
  ),
);
