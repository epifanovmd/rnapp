import { ReactNode } from "react";

export interface SegmentedOption<V extends string = string> {
  label: ReactNode;
  value: V;
  icon?: ReactNode;
  disabled?: boolean;
  /** Описание варианта: SegmentedFormField показывает его под полем. */
  description?: ReactNode;
}
