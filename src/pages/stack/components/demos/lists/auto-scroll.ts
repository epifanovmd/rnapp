/** Отмена прогона: проверяется на каждом кадре. */
export interface IAutoScrollToken {
  cancelled: boolean;
}

/**
 * Скролл с постоянной скоростью, по кадру за шаг.
 *
 * Смещение считается от времени с начала прогона, а не шагом на кадр:
 * медленный кадр не замедляет прогон, а делает скачок длиннее — как у пальца,
 * который не ждёт, пока список дорисует.
 *
 * @returns true — дошёл до `distance`, false — отменён.
 */
export const autoScroll = (
  scrollTo: (offset: number) => void,
  distance: number,
  pxPerSecond: number,
  token: IAutoScrollToken,
  now: () => number = Date.now,
): Promise<boolean> =>
  new Promise(resolve => {
    const startedAt = now();

    const step = () => {
      if (token.cancelled) {
        resolve(false);

        return;
      }

      const offset = Math.min(
        distance,
        ((now() - startedAt) * pxPerSecond) / 1000,
      );

      scrollTo(offset);

      if (offset >= distance) {
        resolve(true);

        return;
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
