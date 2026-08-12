import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootParamList } from "./navigation.types";

/** Единственный ref навигационного контейнера: им владеет и <AppNavigator />, и NavigationService. */
export const navigationRef = createNavigationContainerRef<RootParamList>();
