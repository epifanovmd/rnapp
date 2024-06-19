import { Col, Row } from "@force-dev/react-mobile";
import { observer } from "mobx-react-lite";
import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Platform, ViewStyle } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { useTranslation } from "../../localization";
import { useNavigation, useRoute } from "../../navigation";
import { useTheme } from "../../theme";
import { BackIcon } from "../icons";
import { Text, Touchable } from "../ui";
import createAnimatedComponent = Animated.createAnimatedComponent;

interface IProps {
  title?: string;
  backAction?: boolean;
  action?: React.JSX.Element;
  animatedValue?: SharedValue<number>;
}

const AnimatedCol = createAnimatedComponent(Col);

export const Header: FC<PropsWithChildren<IProps>> = observer(
  ({ title, backAction, children, animatedValue, action }) => {
    const { theme } = useTheme();
    const route = useRoute();
    const { t } = useTranslation();
    const navigation = useNavigation();

    const onBack = useCallback(() => {
      navigation.goBack();
    }, [navigation]);

    const animateStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: animatedValue
            ? interpolate(
                animatedValue.value,
                [0, 60],
                [40, 0],
                Extrapolation.CLAMP,
              )
            : 0,
        },
      ],
    }));

    const [hide, setHide] = useState(false);

    useAnimatedReaction(
      () => {
        return animatedValue?.value;
      },
      (currentValue, previousValue) => {
        runOnJS(setHide)(
          currentValue !== undefined &&
            !(
              currentValue &&
              currentValue !== previousValue &&
              currentValue > 40
            ),
        );
      },
    );

    const actionStyle: ViewStyle = useMemo(
      () => ({
        display: hide ? "none" : "flex",
      }),
      [hide],
    );

    const _title = title || t(`navigation.${route.name}` as any);

    const shadowOffset = useMemo(
      () =>
        Platform.select({
          ios: {
            shadowOffset: {
              width: 0,
              height: 1,
            },
          },
          default: {},
        }),
      [],
    );

    const style = useAnimatedStyle(
      () => ({
        shadowColor: "#000",
        ...shadowOffset,
        shadowOpacity:
          animatedValue &&
          interpolate(
            animatedValue.value,
            [0, 5, 10],
            [0, 0, 0.1],
            Extrapolation.CLAMP,
          ),
        shadowRadius: 1,

        elevation: animatedValue
          ? interpolate(
              animatedValue.value,
              [0, 5, 10],
              [0, 0, 1],
              Extrapolation.CLAMP,
            )
          : 0,
      }),
      [shadowOffset],
    );

    return (
      <AnimatedCol
        minHeight={48}
        style={style}
        ph={8}
        bg={theme.color.background}
      >
        <Row
          alignItems={"stretch"}
          justifyContent={"space-between"}
          minHeight={48}
        >
          <Row
            flexGrow={1}
            flexBasis={0}
            flexShrink={0}
            maxWidth={100}
            minWidth={50}
            alignItems={"center"}
          >
            {!!backAction && (
              <Touchable onPress={onBack}>
                <BackIcon fill={theme.color.text} />
              </Touchable>
            )}
          </Row>

          <Row
            mh={8}
            overflow={"hidden"}
            alignItems={"center"}
            flexShrink={1}
            flexGrow={1}
            flexBasis={0}
            justifyContent={"center"}
          >
            {children ??
              (animatedValue ? (
                <AnimatedCol style={animateStyle}>
                  <Text
                    fontSize={14}
                    fontWeight={"600"}
                    numberOfLines={1}
                    flexShrink={1}
                    ellipsizeMode={"tail"}
                  >
                    {_title}
                  </Text>
                </AnimatedCol>
              ) : (
                !!_title && (
                  <Text fontSize={14} fontWeight={"600"}>
                    {_title}
                  </Text>
                )
              ))}
          </Row>

          <Row
            flexGrow={1}
            flexShrink={0}
            flexBasis={0}
            maxWidth={100}
            minWidth={50}
            alignItems={"center"}
            justifyContent={"flex-end"}
          >
            {action && (
              <Row alignItems={"flex-end"}>
                <AnimatedCol style={actionStyle}>{action}</AnimatedCol>
              </Row>
            )}
          </Row>
        </Row>
      </AnimatedCol>
    );
  },
);

export const useAnimationHeader = () => {
  const animatedValue = useSharedValue(0);

  return {
    animatedValue,
    onScroll: useAnimatedScrollHandler({
      onScroll: event => {
        animatedValue.value = event.contentOffset.y;
      },
    }),
  };
};
