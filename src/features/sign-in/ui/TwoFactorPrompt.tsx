import { Button, Col, Text, TextField } from "@shared/ui";
import React, { FC, useCallback, useState } from "react";

interface ITwoFactorPromptProps {
  /** Подсказка ко второму паролю, заданная при включении 2FA. */
  hint?: string;
  onVerify: (password: string) => Promise<unknown>;
}

/** Подтверждение входа вторым паролем (2FA). */
export const TwoFactorPrompt: FC<ITwoFactorPromptProps> = ({
  hint,
  onVerify,
}) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = useCallback(async () => {
    setLoading(true);
    try {
      await onVerify(password);
    } finally {
      setLoading(false);
    }
  }, [onVerify, password]);

  return (
    <Col gap={12} pa={16} radius={14} bg={"onSurface"}>
      <Col gap={4}>
        <Text textStyle={"Title_S2"}>{"Двухфакторная аутентификация"}</Text>
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {hint
            ? `Введите второй пароль. Подсказка: ${hint}`
            : "Введите второй пароль для подтверждения входа"}
        </Text>
      </Col>
      <TextField
        label={"Второй пароль"}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        autoFocus={true}
      />
      <Button
        title={"Подтвердить вход"}
        loading={loading}
        disabled={!password}
        onPress={handleVerify}
      />
    </Col>
  );
};
