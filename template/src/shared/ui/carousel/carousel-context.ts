import { createContext, useContext } from "react";
import { SharedValue } from "react-native-reanimated";

/** API карусели для слот-компонентов и кастомных контролов (useCarousel). */
export interface ICarouselApi {
  /** Абсолютный прогресс 0..count (дробный между слайдами). */
  progress: SharedValue<number>;
  count: number;
  /** Карусель зациклена — контролы учитывают переход через край. */
  loop: boolean;
  autoplay: boolean;
  /**
   * Автопрокрутка активна — shared value для ворклетов: меняется синхронно
   * в момент остановки, раньше ре-рендера с новым autoplay.
   */
  autoplayActive: SharedValue<boolean>;
  /** Активный слайд для контролов; меняется по приземлению. */
  activeIndex: SharedValue<number>;
  /** Длительность текущего цикла автопрокрутки активного слайда, мс. */
  cycleDuration: SharedValue<number>;
  /** Интервал автопрокрутки, мс. */
  autoplayInterval: number;
  /** Палец на карусели (жест) — контролы могут ставить себя на паузу. */
  touching: SharedValue<boolean>;
  scrollTo: (index: number, animated?: boolean) => void;
  next: () => void;
  prev: () => void;
}

export const CarouselContext = createContext<ICarouselApi | null>(null);

/** Доступ к API карусели внутри `<Carousel>` (слоты, свои контролы). */
export const useCarousel = (): ICarouselApi => {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used inside <Carousel>");
  }

  return context;
};
