/**
 * Автономная работа с клавиатурой: нижняя зона экрана, компенсация
 * перекрытия скролла, заморозка на время оверлеев.
 *
 * Модуль ничего не знает о чате — им пользуется любой экран, где снизу
 * висит панель поверх прокручиваемого контента.
 *
 * ```tsx
 * const { overlay, isFrozen, freeze, restore } = useKeyboardOverlay({
 *   onBlur: () => inputRef.current?.blur(),
 *   onRefocus: () => inputRef.current?.focus(),
 * });
 * const barHeight = useBarHeight();
 * const bottomInset = useBottomInset(overlay, barHeight);
 * const { scrollRef, scrollY, spacerStyle, onLayout, onContentSizeChange } =
 *   useScrollCompensation(bottomInset);
 * <KeyboardFloatingView overlay={overlay}>
 *   <InputBar onHeightChange={h => (barHeight.value = h)} />
 * </KeyboardFloatingView>
 * ```
 */
export * from "./KeyboardFloatingView";
export * from "./use-keyboard-freeze";
export * from "./use-keyboard-height";
export * from "./use-keyboard-overlay";
export * from "./use-scroll-compensation";
