import { createContext } from "react";

import { IScrollTelemetry } from "./scroll.types";

export const ScrollContext = createContext<IScrollTelemetry | null>(null);
