/** Нативный скролл-контейнер списка. */
export interface INativeScrollable {
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
}

/**
 * Двигает нативный ScrollView списка напрямую — как палец, в обход
 * императивного API: `scrollToOffset` AnchorList помечает переезд как
 * программный и не растит запас отрисовки по скорости, а прогон должен
 * проверять список в условиях пользовательского скролла.
 */
export const createScrollDriver =
  (getScrollView: () => INativeScrollable | null | undefined) =>
  (offset: number, animated: boolean) => {
    const scrollView = getScrollView();

    if (!scrollView) return false;

    scrollView.scrollTo({ x: 0, y: offset, animated });

    return true;
  };
