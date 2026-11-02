import { SvgProps } from "react-native-svg";

/**
 * Контракт компонента-иконки в реестре — совместим с lucide-react-native:
 * квадратный `size`, цвет через `color`. Кастомные SVG реализуют этот же
 * контракт (пример — `icons/CheckBold.tsx`).
 */
export interface IIconGlyphProps extends SvgProps {
  size?: string | number;
}
