import { Canvas, makeImageFromView } from "@shopify/react-native-skia";
import React, {
  ComponentProps,
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";

import {
  DISINTEGRATE_DEFAULT_CONFIG,
  disintegrateTotalDuration,
  IDisintegrateConfig,
} from "./disintegrate-config";
import {
  buildDisintegrateParticles,
  IDisintegrateParticles,
} from "./disintegrate-particles";
import { particleSprite } from "./disintegrate-sprite";
import { DisintegrateBurst } from "./DisintegrateBurst";

/** Ссылка на вью, которую можно снять и измерить. */
type DisintegrateTarget = React.RefObject<View | null>;

export interface IDisintegrateContext {
  /**
   * Рассыпать содержимое вью на частицы.
   *
   * Саму вью не трогает: прятать её — забота вызывающего, и сделать это надо
   * по разрешению промиса, иначе снимок застанет её уже скрытой.
   *
   * Возвращает `true`, если распад начался. `false` — снять не удалось, и
   * вызывающему стоит убрать содержимое обычным способом.
   */
  disintegrate(target: DisintegrateTarget): Promise<boolean>;
  /** Эффект доступен: провайдер смонтирован. */
  readonly available: boolean;
}

const NOOP_CONTEXT: IDisintegrateContext = {
  disintegrate: () => Promise.resolve(false),
  available: false,
};

const DisintegrateContext = createContext<IDisintegrateContext>(NOOP_CONTEXT);

/**
 * Доступ к распаду. Вне провайдера возвращает заглушку, которая честно
 * отвечает `available: false` — вызывающему не нужно знать, есть ли провайдер.
 */
export const useDisintegrate = (): IDisintegrateContext =>
  useContext(DisintegrateContext);

interface IBurst {
  id: number;
  x: number;
  y: number;
  duration: number;
  particles: IDisintegrateParticles;
}

/** Измерить вью относительно окна. */
const measure = (view: View): Promise<[number, number, number, number]> =>
  new Promise(resolve =>
    view.measureInWindow((x, y, width, height) =>
      resolve([x, y, width, height]),
    ),
  );

export interface IDisintegrateProviderProps {
  config?: Partial<IDisintegrateConfig>;
  style?: ComponentProps<typeof View>["style"];
}

/**
 * Зона распада: частицы живут здесь, а не в исчезающем содержимом.
 *
 * Так же устроен и нативный аниматор — слой частиц он вешает на всю чат-вью.
 * Иначе облако жило бы внутри удаляемой строки: его обрезали бы её границы, и
 * оно исчезло бы вместе с ней, хотя частицы летят втрое дольше.
 */
export const DisintegrateProvider: FC<
  PropsWithChildren<IDisintegrateProviderProps>
> = ({ config, style, children }) => {
  const rootRef = useRef<View>(null);
  const nextId = useRef(0);
  /** Распады в работе: и готовящиеся, и уже летящие. */
  const running = useRef(0);

  const [bursts, setBursts] = useState<IBurst[]>([]);

  const resolved = useMemo(
    () => ({ ...DISINTEGRATE_DEFAULT_CONFIG, ...config }),
    [config],
  );

  const disintegrate = useCallback(
    async (target: DisintegrateTarget): Promise<boolean> => {
      const view = target.current;
      const root = rootRef.current;

      // Без спрайта рисовать частицы нечем — пусть вызывающий убирает
      // содержимое обычным способом, а не прячет его в никуда.
      if (!view || !root || !particleSprite()) return false;

      // Считает частицы воркет, и цена кадра линейна по их числу: облака,
      // которое уже не разглядеть, не стоит того, чтобы ронять остальные.
      if (running.current >= resolved.maxConcurrent) return false;

      running.current += 1;

      // Счётчик держит удавшийся распад до конца полёта — снимает его `finish`.
      let handedOff = false;

      try {
        const image = await makeImageFromView(target).catch(() => null);

        if (!image) return false;

        // Мерить после снимка: пока он снимается, список может уехать,
        // и облако вышло бы не там, где было содержимое.
        const [[viewX, viewY, width, height], [rootX, rootY]] =
          await Promise.all([measure(view), measure(root)]);

        const particles = buildDisintegrateParticles(
          image,
          width,
          height,
          resolved,
        );

        // Снимок нужен был только ради цветов — дальше он держал бы текстуру зря.
        image.dispose();

        if (!particles) return false;

        const id = nextId.current++;

        setBursts(current => [
          ...current,
          {
            id,
            x: viewX - rootX,
            y: viewY - rootY,
            duration: disintegrateTotalDuration(resolved),
            particles,
          },
        ]);

        handedOff = true;

        return true;
      } finally {
        if (!handedOff) running.current -= 1;
      }
    },
    [resolved],
  );

  const finish = useCallback((id: number) => {
    running.current = Math.max(0, running.current - 1);
    setBursts(current => current.filter(burst => burst.id !== id));
  }, []);

  const value = useMemo<IDisintegrateContext>(
    () => ({ disintegrate, available: true }),
    [disintegrate],
  );

  return (
    <DisintegrateContext.Provider value={value}>
      <View ref={rootRef} style={style} collapsable={false}>
        {children}

        {bursts.length > 0 && (
          <Canvas style={ss.overlay} pointerEvents="none">
            {bursts.map(burst => (
              <DisintegrateBurst
                key={burst.id}
                id={burst.id}
                particles={burst.particles}
                x={burst.x}
                y={burst.y}
                duration={burst.duration}
                additive={resolved.additive}
                onComplete={finish}
              />
            ))}
          </Canvas>
        )}
      </View>
    </DisintegrateContext.Provider>
  );
};

const ss = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});
