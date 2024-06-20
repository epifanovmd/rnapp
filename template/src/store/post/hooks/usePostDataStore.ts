import { iocHook } from "@force-dev/react";

import { IPostDataStore } from "../PostData.types";

export const usePostDataStore = iocHook(IPostDataStore);
