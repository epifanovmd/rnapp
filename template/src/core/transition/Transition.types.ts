import { LayoutChangeEvent } from "react-native";
import { ScrollHandlerProcessed, SharedValue } from "react-native-reanimated";

export type TTransitionDirection = "up" | "down" | "left" | "right" | null;

export interface ITransitionContext {
  navbarHeight: number;
  tabBarHeight: number;
  isDrag: SharedValue<boolean>;
  transitionX: SharedValue<number>;
  transitionY: SharedValue<number>;
  onScroll: ScrollHandlerProcessed;
  scrollDirection: SharedValue<TTransitionDirection>;
  navbarOffset: SharedValue<number>;
  showNavbar: () => void;
  hideNavbar: () => void;
  setNavbarHeight: (height: number) => void;
  onLayoutNavBar: (event: LayoutChangeEvent) => void;
  setTabBarHeight: (height: number) => void;
  onLayoutTabBar: (event: LayoutChangeEvent) => void;
}
