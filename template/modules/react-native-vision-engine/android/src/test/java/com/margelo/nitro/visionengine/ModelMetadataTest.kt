package com.margelo.nitro.visionengine

import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class ModelMetadataTest {
  @Test
  fun parsesIndexedDictionaries() {
    assertEquals(listOf("code", "type"), ModelMetadata.parseLabels("{0: 'code', 1: 'type'}"))
    assertEquals(listOf("code", "type"), ModelMetadata.parseLabels("""{"0":"code","1":"type"}"""))
  }

  @Test
  fun fillsIndexGapsWithEmptyLabels() {
    assertEquals(listOf("a", "", "c"), ModelMetadata.parseLabels("{0: 'a', 2: 'c'}"))
  }

  @Test
  fun parsesLists() {
    assertEquals(listOf("a", "b"), ModelMetadata.parseLabels("['a', 'b']"))
  }

  @Test
  fun readsLabelsFromArchiveAppendedToModel() {
    val model = ByteArray(1024) { (it % 251).toByte() }
    val archive = ByteArrayOutputStream().also { output ->
      ZipOutputStream(output).use { zip ->
        zip.putNextEntry(ZipEntry("metadata.json"))
        zip.write("""{"task":"detect","names":{"0":"code","1":"net"}}""".toByteArray())
        zip.closeEntry()
      }
    }.toByteArray()

    assertEquals(listOf("code", "net"), ModelMetadata.labels(model + archive))
  }

  @Test
  fun returnsNoLabelsWithoutArchive() {
    assertEquals(emptyList<String>(), ModelMetadata.labels(ByteArray(64)))
  }
}
