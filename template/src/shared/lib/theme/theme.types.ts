import { createInjectDecorator } from "@shared/lib/di";

import { IThemeContext } from "./types";

export const IThemeStore = createInjectDecorator<IThemeStore>();

/** Та же форма, что уже отдаёт useTheme() — публичный API не меняется. */
export type IThemeStore = IThemeContext;
