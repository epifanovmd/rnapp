import { useTheme } from "@shared/lib/theme";
import React, { FC, memo, ReactNode } from "react";

import { Col, Row } from "../flex-view";
import { Icon } from "../icon";
import { ITouchableProps, Touchable } from "../touchable";

export interface IDisclosureRowProps extends Omit<ITouchableProps, "children"> {
  children: ReactNode;
  /** Стрелка перехода справа; по умолчанию — когда есть `onPress`. */
  chevron?: boolean;
  /** Отступ между содержимым и стрелкой, px. */
  gap?: number;
}

/**
 * Строка-переход: произвольное содержимое, стрелка справа и нажатие на всю
 * строку. Без `onPress` — обычная строка без стрелки. Фон, отступы и радиус
 * задаёт вызывающий (flex-пропсы).
 */
export const DisclosureRow: FC<IDisclosureRowProps> = memo(
  ({ children, chevron, gap = 12, onPress, ...rest }) => {
    const { colors } = useTheme();
    const showChevron = chevron ?? !!onPress;

    return (
      <Touchable
        disabled={!onPress}
        onPress={onPress}
        accessibilityRole={onPress ? "button" : undefined}
        {...rest}
      >
        <Row alignItems={"center"} gap={gap}>
          <Col flex={1}>{children}</Col>
          {showChevron && (
            <Icon name={"chevronRight"} size={18} color={colors.textTertiary} />
          )}
        </Row>
      </Touchable>
    );
  },
);
