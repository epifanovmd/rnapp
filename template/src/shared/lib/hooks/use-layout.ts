import { useCallback, useState } from "react";
import { LayoutChangeEvent } from "react-native";

export interface ILayoutSize {
  width: number;
  height: number;
}

export interface ILayout extends ILayoutSize {
  onLayout: (event: LayoutChangeEvent) => void;
}

const EMPTY_SIZE: ILayoutSize = { width: 0, height: 0 };

/**
 * Измеренный размер вью: onLayout вешается на измеряемый компонент, размер
 * читается из результата (0 — ещё не измерен).
 *
 * Ре-рендер только при реальном изменении размера: layout-событие прилетает
 * и когда размер не поменялся.
 */
export const useLayout = (): ILayout => {
  const [size, setSize] = useState(EMPTY_SIZE);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setSize(previous =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  return { ...size, onLayout };
};
