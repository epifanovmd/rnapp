import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";

/** Сколько ждать `transitionEnd`, если экран открылся без анимации, мс. */
const FALLBACK_MS = 600;

/**
 * Закончилась ли анимация входа экрана. Тяжёлый контент (графики, длинные
 * списки) монтируется после неё, чтобы не делить кадры с переходом.
 */
export const useTransitionReady = () => {
  const navigation = useNavigation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    const markReady = () => setReady(true);
    const timer = setTimeout(markReady, FALLBACK_MS);
    const unsubscribe = navigation.addListener(
      "transitionEnd" as never,
      ((event: { data?: { closing?: boolean } }) => {
        if (!event.data?.closing) markReady();
      }) as never,
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigation, ready]);

  return ready;
};
