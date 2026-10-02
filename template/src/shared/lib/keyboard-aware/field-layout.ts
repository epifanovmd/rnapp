/**
 * Высота поля изменилась настолько, что нужно пересчитать докрутку. Первый
 * замер (`previous < 0`) — не изменение.
 */
export const isFieldHeightChange = (previous: number, next: number) => {
  "worklet";

  return previous >= 0 && Math.abs(previous - next) >= 0.5;
};
