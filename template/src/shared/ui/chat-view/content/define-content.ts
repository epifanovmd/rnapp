import { ComponentType } from "react";

import { ChatMessage, ChatMessageOwnership } from "../types";
import { ChatContentEmit } from "./content-interaction";
import { ChatContentSizing } from "./content-sizing";
import { ChatContentMap, ChatContentTypeId } from "./content-types";

/**
 * Дескриптор типа контента — единственная точка расширения чата.
 *
 * Всё, что нужно знать о типе всем слоям (разбор, ячейка, пузырь, список),
 * объявляется здесь данными. Ядро читает дескриптор, а не наоборот, поэтому
 * новый тип не требует правок в shared: достаточно добавить дескриптор в реестр.
 *
 * Состояние компонента контента сбрасывается сравнением с предыдущими данными
 * прямо в рендере. Ни `key`, ни `useRecyclingState` из `@legendapp/list` здесь
 * не годятся: первый пересоздаёт вью, ради переиспользования которых
 * включён `recycleItems`, второй требует контекста списка, а пузырь рендерится
 * ещё и в оверлее контекстного меню — вне списка.
 */

/** Пропсы компонента контента. Одинаковы для всех типов. */
export interface IChatContentProps<TContent> {
  content: TContent;
  messageId: string;
  ownership: ChatMessageOwnership;
  /** Доступная ширина внутри пузыря. */
  innerWidth: number;
  /** Отправка события наружу. */
  emit: ChatContentEmit;
}

export interface IChatContentType<K extends ChatContentTypeId> {
  /** Идентификатор типа. */
  id: K;
  /**
   * Порядок разбора: сообщение получает контент первого распознавшего его типа.
   * Больше — раньше.
   */
  priority: number;
  /**
   * Разбор сообщения. Обязана быть чистой и дешёвой: вызывается один раз на
   * идентичность `ChatMessage`, но для каждого типа с бо́льшим приоритетом.
   * Всё тяжёлое (геометрия, форматирование) считается здесь и кладётся в
   * результат — компоненты в рендере не вычисляют ничего.
   */
  parse(message: ChatMessage): ChatContentMap[K] | undefined;
  /**
   * Компонент блока. Обязан быть стабильной ссылкой (модульная константа):
   * новая ссылка на каждый рендер заставит React пересоздавать поддерево.
   */
  Component: ComponentType<IChatContentProps<ChatContentMap[K]>>;
  /** Поведение по ширине пузыря. По умолчанию — `"fill"`. */
  sizing?: ChatContentSizing;
  /**
   * Ключ пула переиспользования ячеек (`getItemType` списка). По умолчанию — `id`.
   *
   * Должен зависеть только от типа, но не от данных: список подбирает контейнер
   * по точному совпадению ключа, и чем больше различных ключей, тем чаще он не
   * находит свой и берёт контейнер из-под чужого поддерева. Дробить осмысленно
   * лишь тогда, когда варианты типа заметно расходятся по высоте.
   */
  recycleKey?(content: ChatContentMap[K]): string;
  /**
   * Краткое описание блока — для цитаты и панели ввода, когда у сообщения
   * нет текста.
   */
  preview?(content: ChatContentMap[K]): string;
}

/**
 * Дескриптор произвольного типа — в таком виде его хранит реестр.
 *
 * Параметр стёрт до `any` намеренно: `Component` принимает пропсы конкретного
 * типа, поэтому дескрипторы разных типов не сводятся к общему параметру
 * (контравариантность). Связь `parse` ↔ `Component` проверяется в
 * `defineChatContent`, до попадания в реестр.
 */
export type AnyChatContentType = IChatContentType<any>;

/**
 * Объявление типа контента. Функция ничего не делает в рантайме — она нужна,
 * чтобы TS вывел `K` из `id` и связал `parse` с `Component` по одному типу.
 */
export const defineChatContent = <K extends ChatContentTypeId>(
  type: IChatContentType<K>,
): IChatContentType<K> => type;
