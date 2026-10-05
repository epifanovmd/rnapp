/** Строки длинного списка под скрываемой шапкой. */
export const NAVBAR_DEMO_ROWS = Array.from(
  { length: 40 },
  (_, index) => index + 1,
);

/** Строки короткого списка: чуть длиннее экрана — край порога скрытия. */
export const NAVBAR_DEMO_SHORT_ROWS = NAVBAR_DEMO_ROWS.slice(0, 12);
