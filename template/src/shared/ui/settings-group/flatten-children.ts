import { Children, Fragment, isValidElement, ReactNode } from "react";

/**
 * Дети плоским списком: фрагменты раскрываются (рекурсивно), пустые узлы
 * (`null`, `false`, `undefined`) отбрасываются.
 */
export const flattenChildren = (children: ReactNode): ReactNode[] =>
  Children.toArray(children).flatMap(child =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenChildren(child.props.children)
      : [child],
  );
