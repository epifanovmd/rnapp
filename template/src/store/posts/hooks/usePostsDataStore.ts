import { iocHook } from "@force-dev/react";

import { IPostsDataStore } from "../PostsData.types";

export const usePostsDataStore = iocHook(IPostsDataStore);
