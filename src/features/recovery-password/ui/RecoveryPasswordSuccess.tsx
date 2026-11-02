import { useTheme } from "@shared/lib/theme";
import { Button, Col, Icon, Text } from "@shared/ui";
import React, { FC } from "react";

interface IRecoveryPasswordSuccessProps {
  /** Сообщение сервера; пустое — текст по умолчанию. */
  message?: string | null;
  onBack: () => void;
}

/** Состояние «письмо отправлено» после запроса сброса пароля. */
export const RecoveryPasswordSuccess: FC<IRecoveryPasswordSuccessProps> = ({
  message,
  onBack,
}) => {
  const { colors } = useTheme();

  return (
    <Col alignItems={"center"} gap={12} pv={16}>
      <Col circle={48} centerContent bg={`${String(colors.success)}26`}>
        <Icon name={"check"} size={24} color={colors.success} />
      </Col>
      <Text textStyle={"Title_M"} textAlign={"center"}>
        {"Письмо отправлено"}
      </Text>
      <Text textStyle={"Body_S2"} color={"textSecondary"} textAlign={"center"}>
        {message ||
          "Если аккаунт с таким логином существует, вы получите ссылку для сброса пароля."}
      </Text>
      <Button
        appearance={"ghost"}
        title={"Вернуться к входу"}
        onPress={onBack}
      />
    </Col>
  );
};
