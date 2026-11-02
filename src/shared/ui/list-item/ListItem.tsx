import { useTheme } from "@shared/lib/theme";
import React, { FC, memo, ReactNode } from "react";

import { DisclosureRow } from "../disclosure-row";
import { Col, Row } from "../flex-view";
import { Icon, TIconName } from "../icon";
import { Text } from "../text";
import { ITouchableProps } from "../touchable";

export interface IListItemProps extends Omit<ITouchableProps, "children"> {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Иконка слева или произвольный элемент (аватар). */
  icon?: TIconName;
  leading?: ReactNode;
  /** Справа: статус, значение, кнопка. */
  trailing?: ReactNode;
  /** Контент под заголовком (метки, метрики). */
  footer?: ReactNode;
  /** Шеврон перехода; по умолчанию — когда есть `onPress`. */
  chevron?: boolean;
}

/** Строка списка-карточки на DisclosureRow: заголовок, подзаголовок, слоты слева/справа и footer. */
export const ListItem: FC<IListItemProps> = memo(
  ({
    title,
    subtitle,
    icon,
    leading,
    trailing,
    footer,
    chevron,
    onPress,
    ...rest
  }) => {
    const { colors } = useTheme();

    return (
      <DisclosureRow
        onPress={onPress}
        chevron={chevron}
        footer={footer}
        bg={"surface"}
        radius={16}
        pv={12}
        ph={14}
        {...rest}
      >
        <Row alignItems={"center"} gap={12}>
          {!!icon && (
            <Col circle={36} centerContent bg={"onSurface"}>
              <Icon name={icon} size={18} color={colors.textSecondary} />
            </Col>
          )}
          {leading}
          <Col flex={1} gap={2}>
            {typeof title === "string" ? (
              <Text textStyle={"Title_S2"} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              title
            )}
            {typeof subtitle === "string" ? (
              <Text
                textStyle={"Caption_M3"}
                color={"textSecondary"}
                numberOfLines={2}
              >
                {subtitle}
              </Text>
            ) : (
              subtitle
            )}
          </Col>
          {trailing}
        </Row>
      </DisclosureRow>
    );
  },
);
