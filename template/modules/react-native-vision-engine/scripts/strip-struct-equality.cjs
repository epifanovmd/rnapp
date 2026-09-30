/**
 * Постобработка кодогена nitrogen: убирает `operator== = default` из
 * сгенерированных C++-структур с полями `std::vector<…>`.
 *
 * Swift 6.2 (Xcode 26) при инстанцировании такого оператора теряет
 * автоматическое соответствие `std::vector` коллекции Swift во всём модуле,
 * и сгенерированные геттеры массивов (`.map`) перестают компилироваться.
 * Модуль структуры не сравнивает — оператор не нужен. Убрать скрипт, когда
 * исправление выйдет в Swift или Nitro (margelo/nitro#1186).
 */
const fs = require("fs");
const path = require("path");

const STRUCTS_DIR = path.join(
  __dirname,
  "..",
  "nitrogen",
  "generated",
  "shared",
  "c++",
);
const EQUALITY_LINE =
  /^\s*friend bool operator==\(const \w+& lhs, const \w+& rhs\) = default;\s*\n/m;
const VECTOR_FIELD = /^\s*(?:std::optional<)?std::vector</m;

const stripped = fs
  .readdirSync(STRUCTS_DIR)
  .filter(name => name.endsWith(".hpp"))
  .filter(name => {
    const file = path.join(STRUCTS_DIR, name);
    const source = fs.readFileSync(file, "utf8");

    if (!VECTOR_FIELD.test(source) || !EQUALITY_LINE.test(source)) {
      return false;
    }
    fs.writeFileSync(file, source.replace(EQUALITY_LINE, ""));

    return true;
  });

console.log(
  `strip-struct-equality: ${stripped.length ? stripped.join(", ") : "nothing to strip"}`,
);
