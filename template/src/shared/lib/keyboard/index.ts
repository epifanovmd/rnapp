/**
 * Автономная работа с клавиатурой: положение плавающей панели, отступ
 * контента, компенсация скролла и заморозка на время оверлеев. О чате модуль
 * не знает — им пользуется любой экран с панелью поверх скролла.
 *
 * Точка входа одна — `useKeyboardInset`:
 *
 * ```tsx
 * const kb = useKeyboardInset({ extraPadding: 8, onBlur, onRefocus });
 *
 * <KeyboardScrollView scroll={kb.scroll}>{content}</KeyboardScrollView>
 * <KeyboardInputBar style={kb.barStyle}>
 *   <InputBar onHeightChange={kb.setBarHeight} />
 * </KeyboardInputBar>
 * ```
 *
 * Остальные хуки экспортированы для нестандартных составов.
 */
export * from "./use-keyboard-height";
export * from "./use-keyboard-inset";
export * from "./use-scroll-compensation";
