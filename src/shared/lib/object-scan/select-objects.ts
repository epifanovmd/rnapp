import type { DetectedObject } from "react-native-vision-engine";

/**
 * Детекции (по убыванию score) → показываемые объекты: только классы из
 * `classes` (не задано или пусто — все), не больше `maxObjects`.
 */
export const selectObjects = (
  objects: DetectedObject[],
  classes: string[] | undefined,
  maxObjects: number,
): DetectedObject[] => {
  "worklet";

  const selected: DetectedObject[] = [];
  const filtered = classes !== undefined && classes.length > 0;

  for (let i = 0; i < objects.length && selected.length < maxObjects; i++) {
    if (!filtered || classes.indexOf(objects[i].label) !== -1) {
      selected.push(objects[i]);
    }
  }

  return selected;
};
