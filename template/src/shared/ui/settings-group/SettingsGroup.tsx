import React, { FC, Fragment, isValidElement, memo, ReactNode } from "react";

import { Divider } from "../divider";
import { Col, FlexProps } from "../flex-view";
import { flattenChildren } from "./flatten-children";

export interface ISettingsGroupProps extends FlexProps {
  children?: ReactNode;
  /** Разделители между строками. По умолчанию `true`. */
  dividers?: boolean;
}

/**
 * Карточка строк настроек (ValueRow, SwitchRow, ListItem и др.): фон
 * `surface`, радиус 16, разделители между строками. Пустые узлы и фрагменты
 * учитываются — условные строки не дают двойных разделителей.
 */
export const SettingsGroup: FC<ISettingsGroupProps> = memo(
  ({ children, dividers = true, ...rest }) => (
    <Col bg={"surface"} radius={16} ph={16} {...rest}>
      {flattenChildren(children).map((child, index) => (
        <Fragment key={isValidElement(child) ? (child.key ?? index) : index}>
          {dividers && index > 0 && <Divider />}
          {child}
        </Fragment>
      ))}
    </Col>
  ),
);
