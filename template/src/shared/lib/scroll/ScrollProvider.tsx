import React, { FC, PropsWithChildren } from "react";

import { IScrollTelemetry } from "./scroll.types";
import { ScrollContext } from "./scroll-context";

interface IProps {
  telemetry: IScrollTelemetry;
}

/** Пробрасывает телеметрию скролла экрана вглубь: барам, хедерам, табам. */
export const ScrollProvider: FC<PropsWithChildren<IProps>> = ({
  telemetry,
  children,
}) => (
  <ScrollContext.Provider value={telemetry}>{children}</ScrollContext.Provider>
);
