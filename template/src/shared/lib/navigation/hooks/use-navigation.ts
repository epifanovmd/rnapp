import { useNavigation as useNavigationBase } from "@react-navigation/native";

/**
 * Навигация в компонентах; типизирована глобальным RootParamList автоматически.
 * Вне React — INavigationService.
 */
export const useNavigation = () => useNavigationBase();
