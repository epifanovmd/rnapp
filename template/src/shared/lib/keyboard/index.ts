/**
 * Автономная работа с клавиатурой: положение плавающей панели, отступ
 * контента, компенсация скролла и заморозка на время оверлеев.
 *
 * Модуль ничего не знает о чате — им пользуется любой экран, где снизу
 * висит панель поверх прокручиваемого контента.
 *
 * Точка входа одна — `useKeyboardInset`. Он отдаёт каждую задачу отдельным
 * значением, чтобы прокидывать её явно:
 *
 * ```tsx
 * const kb = useKeyboardInset({ extraPadding: 8, onBlur, onRefocus });
 *
 * <KeyboardScrollView scroll={kb.scroll}>{content}</KeyboardScrollView>
 *
 * <KeyboardInputBar style={kb.barStyle}>
 *   <InputBar onHeightChange={kb.setBarHeight} />
 * </KeyboardInputBar>
 *
 * kb.freeze();   // контекстное меню: держим ТОЛЬКО отступ контента,
 * kb.restore();  // панель при этом уезжает с клавиатурой (как в эталоне)
 * ```
 *
 * Остальные хуки экспортированы для нестандартных составов; собирать их
 * вручную ради обычного экрана не нужно.
 */
export * from "./use-keyboard-height";
export * from "./use-keyboard-inset";
export * from "./use-scroll-compensation";
