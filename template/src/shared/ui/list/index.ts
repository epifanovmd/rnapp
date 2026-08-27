/**
 * Виртуализированный список.
 *
 * Поведение воспроизводит @legendapp/list v3.3 (MIT, Copyright 2022 Moo.do LLC):
 * механика раскладки, якорения и прилипания повторяется, реализация своя.
 *
 * Наружу выходит только то, чем список пользуются: сам компонент, его типы и
 * два способа читать состояние — `sharedValues` для UI-потока и `useListState`
 * для JS. Внутренности (контейнеры, пул, метрики, стор, компенсация позиции)
 * остаются внутри: они меняются вместе с реализацией, и опираться на них нельзя.
 */
export { List } from "./components";
export type { ListDebugTopic } from "./core";
export { setListDebug } from "./core";
export { useListState, useListValue } from "./hooks";
export type { ListState } from "./model";
export * from "./types";
