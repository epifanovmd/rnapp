import { FC } from "react";
import { StyleProp, ViewProps, ViewStyle } from "react-native";
import { SharedValue } from "react-native-reanimated";

export type TDialogAnimation = "fade" | "scale" | "slide" | "scaleSlide";
export type TDialogPlacement = "top" | "center" | "bottom";
export type TDialogDirection = "up" | "down" | "left" | "right";

/** Императивное управление диалогом (аналогично present/dismiss BottomSheetModal). */
export interface IDialogRef {
  present: () => void;
  /** В неуправляемом режиме закрывает диалог; в управляемом — вызывает onClose. */
  dismiss: () => void;
}

export interface IDialogBackdropProps {
  /** Прогресс видимости 0..1 с учётом свайпа карточки. */
  progress: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
}

export interface IDialogProps extends ViewProps {
  /**
   * Управляемая видимость. Если не задана — диалог неуправляемый и
   * открывается/закрывается через ref (present/dismiss).
   */
  isVisible?: boolean;
  /** Запрос закрытия: тап по фону, свайп, аппаратная кнопка «назад». */
  onClose?: () => void;
  /** Анимация открытия завершена. */
  onOpened?: () => void;
  /** Анимация закрытия завершена, диалог размонтирован. */
  onClosed?: () => void;
  placement?: TDialogPlacement;
  animationType?: TDialogAnimation;
  /** Сторона, с которой появляется диалог при slide-анимации. */
  animationDirection?: TDialogDirection;
  animationDuration?: number;
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  maxWidth?: ViewStyle["maxWidth"];
  maxHeight?: ViewStyle["maxHeight"];
  /** Отступ от края экрана при placement top/bottom, если нет safe-area. */
  offset?: number;
  enableBackdropClose?: boolean;
  enableSwipeClose?: boolean;
  /** Направление свайпа закрытия; по умолчанию совпадает с animationDirection. */
  swipeDirection?: TDialogDirection;
  /** Доля размера карточки, после которой свайп закрывает диалог. */
  swipeThreshold?: number;
  /** Закрытие аппаратной кнопкой «назад» (Android). */
  enableBackButtonClose?: boolean;
  backdropOpacity?: number;
  backdropColor?: string;
  /** Свой компонент подложки (аналог backdropComponent BottomSheet). */
  backdropComponent?: FC<IDialogBackdropProps>;
  /** Тактильный отклик при открытии. */
  haptic?: boolean;
}
