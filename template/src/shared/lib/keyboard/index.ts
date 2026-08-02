/**
 * Автономная работа с клавиатурой: положение плавающей панели, отступ контента
 * и компенсация скролла. О чате модуль не знает — им пользуется любой экран
 * с панелью поверх скролла.
 *
 * Хуки используются по отдельности:
 *
 * ```tsx
 * const kb = useKeyboardInset({ extraPadding: 8, onBlur, onRefocus });
 * const compensation = useKeyboardScrollCompensation(
 *   kb.contentInset,
 *   kb.reservedInset,
 * );
 *
 * <KeyboardScrollView scroll={compensation}>{content}</KeyboardScrollView>
 * <KeyboardInputBar style={kb.barStyle}>
 *   <InputBar onHeightChange={kb.setBarHeight} />
 * </KeyboardInputBar>
 * ```
 */
export * from "./use-keyboard-height";
export * from "./use-keyboard-inset";
export * from "./use-keyboard-scroll-compensation";
