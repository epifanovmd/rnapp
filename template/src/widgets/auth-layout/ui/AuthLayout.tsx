import { APP_NAME, APP_VERSION } from "@shared/config/app-info";
import { useTheme } from "@shared/lib/theme";
import { Col, Icon, KeyboardAwareScrollView, Text } from "@shared/ui";
import React, { FC, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Оформление auth-экрана без шапки навигатора: логотип, название, карточка формы и версия. */
export const AuthLayout: FC<PropsWithChildren> = ({ children }) => {
  const { colors } = useTheme();
  const { top, bottom } = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: 24 + top, paddingBottom: 24 + bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Col alignItems={"center"} gap={12} mb={24}>
        <Col
          width={56}
          height={56}
          radius={16}
          bg={"primary"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <Icon name={"shieldCheck"} size={28} color={colors.white} />
        </Col>
        <Text textStyle={"Title_XL"} textAlign={"center"}>
          {APP_NAME}
        </Text>
      </Col>

      <Col bg={"surface"} radius={20} pa={20}>
        {children}
      </Col>

      <Text
        mt={24}
        textStyle={"Caption_M1"}
        color={"textSecondary"}
        textAlign={"center"}
      >
        {`Версия ${APP_VERSION}`}
      </Text>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
