import React, { FC, memo, useCallback } from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { useChatTheme } from "./ChatThemeProvider";

export interface attachButtonProps {
  containerStyle?: StyleProp<ViewStyle>;
  icon?: (fill: string) => React.ReactElement | null;
  onPressAttachButton?: () => void;
}

export const AttachButton: FC<attachButtonProps> = memo(
  ({ containerStyle, icon, onPressAttachButton }) => {
    const theme = useChatTheme();

    const renderIcon = useCallback(() => {
      if (icon) {
        return icon(theme.toolbarActionIconFill);
      }

      return (
        <Svg
          height={18}
          width={18}
          viewBox="0 0 24 24"
          fill={theme.toolbarActionIconFill}
        >
          <Path d="M16.5,6V17.5A4,4 0 0,1 12.5,21.5A4,4 0 0,1 8.5,17.5V5A2.5,2.5 0 0,1 11,2.5A2.5,2.5 0 0,1 13.5,5V15.5A1,1 0 0,1 12.5,16.5A1,1 0 0,1 11.5,15.5V6H10V15.5A2.5,2.5 0 0,0 12.5,18A2.5,2.5 0 0,0 15,15.5V5A4,4 0 0,0 11,1A4,4 0 0,0 7,5V17.5A5.5,5.5 0 0,0 12.5,23A5.5,5.5 0 0,0 18,17.5V6H16.5Z" />
        </Svg>
      );
    }, [icon, theme.toolbarActionIconFill]);

    return (
      <TouchableOpacity
        style={[styles.container, containerStyle]}
        onPress={onPressAttachButton}
      >
        {renderIcon()}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
