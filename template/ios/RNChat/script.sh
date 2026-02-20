#!/bin/bash

# Название итогового файла
OUTPUT_FILE="combined_swift_files.swift"

# Проверяем, существует ли уже выходной файл, и удаляем его
if [ -f "$OUTPUT_FILE" ]; then
    echo "Удаляем существующий файл $OUTPUT_FILE"
    rm "$OUTPUT_FILE"
fi

# Добавляем заголовок в начало файла
echo "// =========================================" >> "$OUTPUT_FILE"
echo "// Объединенный файл Swift" >> "$OUTPUT_FILE"
echo "// Создан: $(date)" >> "$OUTPUT_FILE"
echo "// =========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Находим все .swift файлы рекурсивно и обрабатываем их
find . -name "*.swift" -type f | while read -r swift_file; do
    # Пропускаем сам выходной файл, чтобы не включить его в себя
    if [[ "$swift_file" == "./$OUTPUT_FILE" ]]; then
        continue
    fi

    echo "Добавляю файл: $swift_file"

    # Добавляем разделитель для каждого файла
    echo "" >> "$OUTPUT_FILE"
    echo "// =========================================" >> "$OUTPUT_FILE"
    echo "// Файл: $swift_file" >> "$OUTPUT_FILE"
    echo "// =========================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    # Добавляем содержимое файла
    cat "$swift_file" >> "$OUTPUT_FILE"
done

echo ""
echo "Все Swift файлы объединены в $OUTPUT_FILE"
echo "Количество обработанных файлов: $(find . -name "*.swift" -type f ! -name "$OUTPUT_FILE" | wc -l | tr -d ' ')"
