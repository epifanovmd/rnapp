import { FunctionComponent } from "react";

import { useFlexProps } from "../hooks";
import { FlexProps } from "../types";

export const createFlexViewComponent = <P extends object>(
  Component: FunctionComponent<P>,
): FunctionComponent<P & FlexProps> => {
  return props => {
    const { style, ownProps } = useFlexProps(props);

    return <Component {...(ownProps as P)} style={style} />;
  };
};
