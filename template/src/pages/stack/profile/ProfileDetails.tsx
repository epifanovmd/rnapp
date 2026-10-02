import { Col, SettingsGroup, Text, ValueRow } from "@shared/ui";
import React, { FC, ReactNode } from "react";

/** Строка сведений профиля: подпись и значение (пустое — прочерк). */
export interface IProfileField {
  label: string;
  value?: ReactNode;
}

interface IProfileDetailsProps {
  title: string;
  fields: IProfileField[];
  onPress?: () => void;
}

const EMPTY_VALUE = (
  <Text textStyle={"Body_M2"} color={"textTertiary"}>
    {"—"}
  </Text>
);

/** Группа сведений профиля: заголовок над карточкой строк «подпись — значение». */
export const ProfileDetails: FC<IProfileDetailsProps> = ({
  title,
  fields,
  onPress,
}) => (
  <Col gap={8}>
    <Text textStyle={"Caption_M1"} color={"textSecondary"} ph={16}>
      {title}
    </Text>
    <SettingsGroup>
      {fields.map(field => (
        <ValueRow
          key={field.label}
          label={field.label}
          value={field.value || EMPTY_VALUE}
          onPress={onPress}
        />
      ))}
    </SettingsGroup>
  </Col>
);
