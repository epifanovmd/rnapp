package com.margelo.nitro.visionengine

import org.json.JSONObject
import java.util.zip.Inflater

/**
 * Разбор метаданных моделей детекции. Метаданные TFLite-модели — JSON-файл
 * в zip-архиве, дописанном в хвост файла модели.
 */
internal object ModelMetadata {
  /** Имя файла метаданных в архиве модели */
  private const val METADATA_ENTRY = "metadata.json"

  /** Ключ метаданных с именами классов */
  private const val LABELS_KEY = "names"

  private const val EOCD_SIGNATURE = 0x06054b50
  private const val CENTRAL_SIGNATURE = 0x02014b50
  private const val LOCAL_SIGNATURE = 0x04034b50
  private const val EOCD_MIN_SIZE = 22
  private const val MAX_COMMENT_SIZE = 0xFFFF
  private const val METHOD_STORED = 0
  private const val METHOD_DEFLATED = 8

  /** Имена классов из метаданных модели; пусто — метаданных нет */
  fun labels(model: ByteArray): List<String> {
    val raw = zipEntry(model, METADATA_ENTRY) ?: return emptyList()

    return try {
      val names = JSONObject(String(raw, Charsets.UTF_8)).opt(LABELS_KEY) ?: return emptyList()
      parseLabels(names.toString())
    } catch (_: Exception) {
      emptyList()
    }
  }

  /**
   * Имена классов по индексу из строки метаданных. Понимает словарь
   * `{0: 'a', 1: 'b'}` / `{"0": "a"}` и список `['a', 'b']` / `["a", "b"]`.
   * Пропуски индексов заполняются пустыми строками.
   */
  fun parseLabels(raw: String): List<String> {
    val indexed = Regex("""(\d+)['"]?\s*:\s*['"]([^'"]*)['"]""").findAll(raw).toList()
    if (indexed.isNotEmpty()) {
      val byIndex = indexed.associate { it.groupValues[1].toInt() to it.groupValues[2] }
      val maxIndex = byIndex.keys.maxOrNull() ?: return emptyList()
      return (0..maxIndex).map { byIndex[it] ?: "" }
    }

    return Regex("""['"]([^'"]*)['"]""").findAll(raw).map { it.groupValues[1] }.toList()
  }

  /** Содержимое файла архива, дописанного в хвост данных; null — архива или файла нет */
  private fun zipEntry(data: ByteArray, name: String): ByteArray? {
    val eocd = findEndOfCentralDirectory(data) ?: return null
    val entries = u16(data, eocd + 10)
    val centralSize = u32(data, eocd + 12)
    val centralOffset = u32(data, eocd + 16)
    val centralStart = eocd - centralSize
    // архив дописан к модели — смещения в нём отсчитываются от начала архива
    val base = centralStart - centralOffset
    if (centralStart < 0 || base < 0) {
      return null
    }

    var cursor = centralStart
    repeat(entries) {
      if (cursor + 46 > data.size || u32(data, cursor) != CENTRAL_SIGNATURE) {
        return null
      }
      val nameLength = u16(data, cursor + 28)
      val entryLength = 46 + nameLength + u16(data, cursor + 30) + u16(data, cursor + 32)
      if (cursor + entryLength > data.size) {
        return null
      }
      if (String(data, cursor + 46, nameLength, Charsets.UTF_8) == name) {
        return readLocalEntry(
          data,
          offset = base + u32(data, cursor + 42),
          method = u16(data, cursor + 10),
          compressedSize = u32(data, cursor + 20),
          size = u32(data, cursor + 24),
        )
      }
      cursor += entryLength
    }

    return null
  }

  private fun readLocalEntry(
    data: ByteArray,
    offset: Int,
    method: Int,
    compressedSize: Int,
    size: Int,
  ): ByteArray? {
    if (offset < 0 || offset + 30 > data.size || u32(data, offset) != LOCAL_SIGNATURE) {
      return null
    }
    val start = offset + 30 + u16(data, offset + 26) + u16(data, offset + 28)
    if (compressedSize < 0 || size < 0 || start + compressedSize > data.size) {
      return null
    }

    return when (method) {
      METHOD_STORED -> data.copyOfRange(start, start + compressedSize)
      METHOD_DEFLATED -> {
        val inflater = Inflater(true)
        try {
          inflater.setInput(data, start, compressedSize)
          val output = ByteArray(size)
          val read = inflater.inflate(output)
          if (read == size) output else null
        } catch (_: Exception) {
          null
        } finally {
          inflater.end()
        }
      }
      else -> null
    }
  }

  private fun findEndOfCentralDirectory(data: ByteArray): Int? {
    val last = data.size - EOCD_MIN_SIZE
    val first = maxOf(0, last - MAX_COMMENT_SIZE)
    for (position in last downTo first) {
      if (u32(data, position) == EOCD_SIGNATURE) {
        return position
      }
    }

    return null
  }

  private fun u16(data: ByteArray, offset: Int): Int {
    return (data[offset].toInt() and 0xFF) or ((data[offset + 1].toInt() and 0xFF) shl 8)
  }

  /** Модели меньше 2 ГБ — 32-битные поля архива укладываются в Int */
  private fun u32(data: ByteArray, offset: Int): Int {
    return u16(data, offset) or (u16(data, offset + 2) shl 16)
  }
}
