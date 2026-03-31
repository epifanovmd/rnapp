import { iocHook } from "@di";

import { IFileUploadStore } from "../FileUploadStore.types";

export const useFileUploadStore = iocHook(IFileUploadStore);
