import { FlexProps, Row } from "@components";
import { useTranslation } from "@core";
import React, { FC, memo, PropsWithChildren, useCallback } from "react";
import SwitchToggle from "react-native-switch-toggle";

interface IProps extends FlexProps {}

export const SwitchLang: FC<PropsWithChildren<IProps>> = memo(({ ...rest }) => {
  const { changeLanguage, i18n } = useTranslation();

  const change = useCallback(() => {
    if (i18n.language === "ru") {
      changeLanguage("en").then();
    } else {
      changeLanguage("ru").then();
    }
  }, [changeLanguage, i18n.language]);

  return (
    <Row {...rest}>
      <SwitchToggle
        switchOn={i18n.language === "ru"}
        backTextRight={i18n.language}
        buttonStyle={{
          position: "absolute",
          zIndex: 10,
          backgroundColor: "#62c28e",
          marginLeft: i18n.language === "ru" ? -1 : 1,
        }}
        rightContainerStyle={{
          flex: 1,
          alignItems: i18n.language === "ru" ? "flex-start" : "flex-end",
          zIndex: 9,
          borderRadius: 16,
          paddingHorizontal: 6,
        }}
        textLeftStyle={{
          fontSize: 11,
        }}
        textRightStyle={{
          fontSize: 11,
        }}
        containerStyle={{
          alignItems: "center",
          width: 40,
          height: 18,
          borderRadius: 15,
        }}
        backgroundColorOn="#fefefe"
        backgroundColorOff="#fefefe"
        circleStyle={{
          width: 16,
          height: 16,
          borderRadius: 16,
        }}
        onPress={change}
        circleColorOff="#e5e1e0"
        circleColorOn="#e5e1e0"
        duration={100}
      />
    </Row>
  );
});
