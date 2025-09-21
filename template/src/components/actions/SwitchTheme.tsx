import { useTheme } from "@core";
import React, { FC, memo, PropsWithChildren } from "react";
import SwitchToggle from "react-native-switch-toggle";

import { FlexProps, Row } from "../flexView";

interface IProps extends FlexProps {}

export const SwitchTheme: FC<PropsWithChildren<IProps>> = memo(
  ({ ...rest }) => {
    const { name, isLight, toggleTheme } = useTheme();

    return (
      <Row {...rest}>
        <SwitchToggle
          switchOn={isLight}
          backTextRight={name}
          buttonStyle={{
            position: "absolute",
            zIndex: 10,
            backgroundColor: "#62c28e",
            marginLeft: isLight ? -1 : 1,
          }}
          rightContainerStyle={{
            flex: 1,
            alignItems: isLight ? "flex-start" : "flex-end",
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
            width: 50,
            height: 20,
            borderRadius: 15,
          }}
          backgroundColorOn="#fefefe"
          backgroundColorOff="#fefefe"
          circleStyle={{
            width: 18,
            height: 18,
            borderRadius: 16,
          }}
          onPress={toggleTheme}
          circleColorOff="#e5e1e0"
          circleColorOn="#e5e1e0"
          duration={100}
        />
      </Row>
    );
  },
);
