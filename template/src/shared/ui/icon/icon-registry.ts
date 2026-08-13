import {
  ArrowLeft,
  Camera,
  Check,
  CircleX,
  Eye,
  EyeOff,
  FileText,
  Image,
  Save,
  Search,
  Settings,
  X,
} from "lucide-react-native";
import { ComponentType } from "react";

import { IIconGlyphProps } from "./icon.types";
import { CheckBoldIcon } from "./icons/CheckBold";

/**
 * Реестр иконок приложения.
 *
 * Добавить lucide-иконку: импорт из `lucide-react-native` → строка в map.
 * Добавить кастомную: компонент по контракту `IIconGlyphProps`
 * (пример — `icons/CheckBold.tsx`) → строка в map. Имя подхватится
 * типом `TIconName` и галереей (`ICON_NAMES`) автоматически.
 */
export const ICONS_MAP = {
  back: ArrowLeft,
  camera: Camera,
  check: Check,
  checkBold: CheckBoldIcon,
  close: X,
  closeCircle: CircleX,
  document: FileText,
  eye: Eye,
  eyeOff: EyeOff,
  image: Image,
  save: Save,
  search: Search,
  settings: Settings,
} satisfies Record<string, ComponentType<IIconGlyphProps>>;

export type TIconName = keyof typeof ICONS_MAP;

/** Все имена иконок набора (галереи, демо, итерация). */
export const ICON_NAMES = Object.keys(ICONS_MAP) as TIconName[];
