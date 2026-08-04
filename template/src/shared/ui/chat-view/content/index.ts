/**
 * Ядро системы типов контента: словарь типов, дескриптор и реестр.
 *
 * Встроенные дескрипторы (`./builtin`) сознательно не реэкспортируются: они
 * тянут за собой React-компоненты, а этот модуль импортируют слой данных и
 * контекст. Реестр встроенных типов собирает корень чата.
 */

export * from "./content-interaction";
export * from "./content-registry";
export * from "./content-sizing";
export * from "./content-types";
export * from "./define-content";
