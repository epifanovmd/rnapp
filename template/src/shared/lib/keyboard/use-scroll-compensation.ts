import { useCallback, useMemo } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  scrollTo,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
} from "react-native-reanimated";

/**
 * Компенсация перекрытия скролла снизу — порт `updateCollectionInsets`
 * из `ChatViewController` (IOSChatView).
 *
 * ## Единый источник сдвига
 *
 * Главное свойство эталона не в формуле, а в том, что источник движения
 * **один**: панель висит на `keyboardLayoutGuide`, а инсет коллекции
 * выводится из `inputBar.frame.minY` — то есть список следует за панелью,
 * а не за клавиатурой отдельно от неё. Разъехаться они не могут в принципе.
 *
 * Здесь так же: и `translateY` панели, и зона списка читают **одно и то же**
 * `bottomInset` в одном кадре на UI-потоке. Никаких двух подписок на
 * клавиатуру, никаких двух кривых анимации.
 *
 * Именно поэтому компенсация не отдана `KeyboardChatScrollView`: он
 * подписывается на клавиатуру сам, в `onStart` выставляет паддинг сразу на
 * полную высоту, а позицию скролла догоняет своим расчётом. Панель при этом
 * едет покадрово за нативным прогрессом — и список визуально отстаёт.
 *
 * ## Готовность диапазона
 *
 * У распорки есть цена, которой нет у `contentInset`: высота — это layout,
 * и `contentSize` нативного скролла обновляется на кадр позже. У самого
 * низа это видно: `scrollTo` каждый кадр упирается в ещё не выросший
 * диапазон, и контент отстаёт от панели (панель едет трансформацией, ей
 * layout не нужен).
 *
 * Поэтому распорка растёт **по цели, а не по текущему значению**:
 * клавиатура сообщает конечную высоту в `onStart`, до первого кадра
 * движения, так что к моменту анимации место уже готово и подрезать нечего.
 * Позиция при этом едет покадрово по `bottomInset` — резерв ниже линии
 * сгиба и не виден.
 *
 * ## Как работает
 *
 * Перекрытие живёт **распоркой в конце контента**, а не в `contentInset`:
 * на Android инсета нет, а распорка одинаково работает везде и — в отличие
 * от инсета — входит в размер контента, поэтому `scrollToEnd`, автоскролл
 * и любые расчёты «внизу ли скролл» корректны без поправок.
 *
 * Единственное состояние — `appliedInset`: сколько перекрытия уже учтено
 * **и в распорке, и в позиции скролла**. Каждое изменение считается дельтой
 * от него, скролл двигается на ту же дельту, расстояние до конца контента
 * сохраняется. Модель самовосстанавливается: дельта берётся от реально
 * применённого значения, поэтому любое количество пропущенных событий
 * (заморозка, поворот, смена панели) схлопывается в один корректный шаг.
 *
 * ## Заморозка
 *
 * Отдельного флага нет: замораживает тот, кто владеет `bottomInset`, —
 * достаточно перестать его обновлять. В чате это `overlay`, от которого
 * живут и панель, и FAB, поэтому всё замирает и оттаивает как одно целое.
 * Побочный эффект: класс ошибок вида «разморозились раньше, чем вернулась
 * клавиатура» здесь не существует.
 *
 * ## Использование
 *
 * ```tsx
 * const kb = useKeyboardInset();
 * // kb.scroll — это и есть результат этого хука.
 * ```
 */

export interface IScrollCompensation {
  /** Ref скролла — на него уходит `scrollTo` с UI-потока. */
  scrollRef: AnimatedRef<Animated.ScrollView>;
  /** Стиль распорки в конце контента. */
  spacerStyle: AnimatedStyle<{ height: number }>;
  onLayout: (event: LayoutChangeEvent) => void;
  onContentSizeChange: (width: number, height: number) => void;
  /**
   * Обязательны к подключению: пока палец на экране, позицией управляет
   * жест, и компенсация обязана в неё не вмешиваться (порт раннего выхода
   * `if isUserDragging` из `updateCollectionInsets`).
   */
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
}

export const useScrollCompensation = (
  bottomInset: SharedValue<number>,
  /**
   * Зона, к которой идёт движение (целевая высота клавиатуры плюс панель).
   * Под неё распорка резервирует место сразу, ещё до анимации.
   * Без неё компенсация работает, но у самого низа отстаёт на кадр — см.
   * «Готовность диапазона» выше.
   */
  reservedInset?: SharedValue<number>,
): IScrollCompensation => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  /** Сколько перекрытия уже учтено и в распорке, и в позиции скролла. */
  const appliedInset = useSharedValue(0);
  /** Палец на экране. Порт `isUserDragging`. */
  const isUserDragging = useSharedValue(false);
  /** Целились в конец, но нативный скролл подрезал — досылаем после коммита. */
  const pendingEndPin = useSharedValue(false);
  /**
   * Фактическая позиция скролла. Читается отсюда, а не подставляется
   * снаружи: дельту нужно считать от реального положения, иначе после
   * любого ручного скролла база устаревает. Хук остаётся самодостаточным —
   * потребителю достаточно отдать `scrollRef`.
   */
  const scrollY = useScrollViewOffset(scrollRef);
  const contentHeight = useSharedValue(0);
  const viewportHeight = useSharedValue(0);

  /**
   * Фактическая высота распорки: максимум из применённой зоны и той, под
   * которую резервируем. При открытии резерв больше — место готово заранее.
   * При закрытии больше применённая, и распорка сжимается вместе с ней.
   */
  const spacerHeight = useSharedValue(0);

  useAnimatedReaction(
    () => bottomInset.value,
    target => {
      const applied = appliedInset.value;
      const delta = target - applied;

      if (Math.abs(delta) < 0.5) return;

      const reserve = reservedInset?.value ?? 0;
      const previousSpacer = Math.max(applied, reserve);

      // Распорка меняется первой — она и есть «нижний инсет».
      appliedInset.value = target;
      spacerHeight.value = Math.max(target, reserve);

      // Порт раннего выхода `if isUserDragging` из updateCollectionInsets:
      // пока палец на экране, эталон обновляет только инсет и НЕ трогает
      // contentOffset. Позицией в этот момент управляет жест — при
      // интерактивном закрытии клавиатуры контент уже едет за пальцем, и
      // вторая коррекция поверх него уводила бы список вниз сама по себе.
      // Догонять потом не нужно: зона учтена распоркой, а расстояние до
      // конца контента задал сам пользователь.
      if (isUserDragging.value) return;

      // Ожидаемая высота контента после коммита распорки: сам коммит
      // отстаёт на кадр, а решение о скролле нужно сейчас.
      const contentEnd =
        contentHeight.value - previousSpacer + spacerHeight.value;
      const maxOffset = contentEnd - viewportHeight.value;

      // Контент короче видимой области — держим прижатым к верху.
      if (maxOffset <= 0) return;

      const next = Math.min(Math.max(scrollY.value + delta, 0), maxOffset);

      // Взводим добор, если целились в самый конец: нативный скролл сейчас
      // подрежет запрошенный offset по ещё не выросшему contentSize.
      pendingEndPin.value = next >= maxOffset - 0.5;

      // Позицию ведём сами: реакция срабатывает на каждый кадр анимации,
      // и база для следующей дельты должна быть актуальной.
      scrollY.value = next;
      scrollTo(scrollRef, 0, next, false);
    },
  );

  // Добор до самого низа после коммита распорки.
  //
  // Зона у нас — распорка, а не `contentInset`: у эталона инсет расширяет
  // диапазон скролла мгновенно, а высота распорки проходит через layout, и
  // `contentSize` отстаёт на кадр. У самого низа реакция выше просит
  // максимальный offset, нативный скролл подрезает его по старому размеру —
  // и последнее сообщение остаётся чуть ниже, чем нужно.
  //
  // Это не второй источник движения: добор не ведёт позицию, а лишь
  // досылает то, что уже было запрошено, как только диапазон вырос. Он
  // только увеличивает offset в сторону конца и живёт ровно до ближайшего
  // коммита — поэтому не может ни отставать, ни перехватить управление
  // (например, у prepend, где позицию держит maintainVisibleContentPosition).
  useAnimatedReaction(
    () => contentHeight.value,
    height => {
      if (!pendingEndPin.value || isUserDragging.value) return;

      // Одноразовый: следующий кадр анимации взведёт заново, если нужно.
      pendingEndPin.value = false;

      const maxOffset = height - viewportHeight.value;

      if (maxOffset <= 0) return;
      if (scrollY.value >= maxOffset - 0.5) return;

      scrollY.value = maxOffset;
      scrollTo(scrollRef, 0, maxOffset, false);
    },
  );

  // Резерв применяется и сам по себе: клавиатура сообщает цель в onStart,
  // до первого кадра движения, и распорка обязана вырасти уже тогда.
  useAnimatedReaction(
    () => Math.max(appliedInset.value, reservedInset?.value ?? 0),
    height => {
      if (Math.abs(height - spacerHeight.value) < 0.5) return;

      spacerHeight.value = height;
    },
  );

  const spacerStyle = useAnimatedStyle(() => ({
    height: spacerHeight.value,
  }));

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeight.value = event.nativeEvent.layout.height;
    },
    [viewportHeight],
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeight.value = height;
    },
    [contentHeight],
  );

  const onScrollBeginDrag = useCallback(() => {
    isUserDragging.value = true;
    // Пользователь перехватил управление — досылать конец больше не нужно.
    pendingEndPin.value = false;
  }, [isUserDragging, pendingEndPin]);

  const onScrollEndDrag = useCallback(() => {
    isUserDragging.value = false;
  }, [isUserDragging]);

  return useMemo(
    () => ({
      scrollRef,
      spacerStyle,
      onLayout,
      onContentSizeChange,
      onScrollBeginDrag,
      onScrollEndDrag,
    }),
    [
      scrollRef,
      spacerStyle,
      onLayout,
      onContentSizeChange,
      onScrollBeginDrag,
      onScrollEndDrag,
    ],
  );
};
