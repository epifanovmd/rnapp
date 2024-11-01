import React, { FC, memo, useCallback, useRef, useState } from "react";
import {
  ColorValue,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";

import { Image } from "../ui";
import { User } from "./types";

export interface ChatAvatarProps {
  user?: User;
  avatarStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextStyle>;

  onPress?: (user: User) => void;
  onLongPress?: (user: User) => void;
}

enum LoadingState {
  "Pending" = "pending",
  "Ready" = "ready",
  "Loading" = "loading",
  "Error" = "error",
}

const getHash = (str: string) => {
  let hash = 0;
  const len = str.length;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < len; i++) {
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash |= 0; // to 32bit integer
  }

  return hash;
};

const colors = [
  "#fc5c65",
  "#fd9644",
  "#fed330",
  "#26de81",
  "#2bcbba",
  "#eb3b5a",
  "#fa8231",
  "#f7b731",
  "#20bf6b",
  "#0fb9b1",
  "#45aaf2",
  "#4b7bec",
  "#a55eea",
  "#778ca3",
  "#2d98da",
  "#3867d6",
  "#8854d0",
  "#8854d0",
  "#a5b1c2",
  "#4b6584",
];

export const ChatAvatar: FC<ChatAvatarProps> = memo(
  ({ user, avatarStyle, textStyle, onPress, onLongPress }) => {
    const avatarName = useRef<string>();
    const avatarColor = useRef<ColorValue>();
    const [loadingState, setLoadingState] = useState<LoadingState>(
      LoadingState.Pending,
    );

    const setAvatarColor = useCallback(() => {
      const userName = user?.name || "U";
      const name = userName.toUpperCase().split(" ");

      if (name.length === 1) {
        avatarName.current = `${name[0]?.charAt(0)}`;
      } else if (name.length > 1) {
        avatarName.current = `${name[0]?.charAt(0)}${name[1]?.charAt(0)}`;
      } else {
        avatarName.current = "";
      }

      avatarColor.current = colors[Math.abs(getHash(userName)) % colors.length];
    }, [user?.name]);

    setAvatarColor();

    const renderAvatar = useCallback(
      (hide?: boolean) => {
        if (user) {
          if (typeof user.avatar === "function") {
            return user.avatar([styles.avatarStyle, avatarStyle]);
          } else if (typeof user.avatar === "string") {
            return (
              <Image
                url={user.avatar}
                style={[
                  styles.avatarStyle,
                  avatarStyle,
                  {
                    zIndex: 100,
                    position: hide ? "absolute" : undefined,
                    opacity: hide ? 0 : 1,
                  },
                ]}
                onLoadStart={() => {
                  setLoadingState(LoadingState.Loading);
                }}
                onLoad={() => {
                  setLoadingState(LoadingState.Ready);
                }}
                onError={() => {
                  setLoadingState(LoadingState.Error);
                }}
              />
            );
          }
        }

        return null;
      },
      [avatarStyle, user],
    );

    const renderInitials = useCallback(
      (hide?: boolean) => {
        if (hide) {
          return null;
        }

        return (
          <Text style={[styles.textStyle, textStyle]}>
            {avatarName.current}
          </Text>
        );
      },
      [textStyle],
    );

    const handleOnPress = useCallback(() => {
      if (onPress && user) {
        onPress(user);
      }
    }, [onPress, user]);

    const handleOnLongPress = useCallback(() => {
      if (onLongPress && user) {
        onLongPress(user);
      }
    }, [onLongPress, user]);

    if (!user || (!user.name && !user.avatar)) {
      return (
        <View
          style={[styles.avatarStyle, styles.avatarTransparent, avatarStyle]}
        />
      );
    }

    return (
      <TouchableOpacity
        disabled={!onPress || !user}
        onPress={handleOnPress}
        onLongPress={handleOnLongPress}
        style={[
          styles.avatarStyle,
          { backgroundColor: avatarColor.current },
          avatarStyle,
        ]}
      >
        {renderAvatar(
          loadingState === LoadingState.Loading ||
            loadingState === LoadingState.Error,
        )}
        {renderInitials(
          (loadingState === LoadingState.Ready ||
            loadingState === LoadingState.Pending) &&
            !!user.avatar,
        )}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  avatarStyle: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarTransparent: {
    backgroundColor: "transparent",
  },
  textStyle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
