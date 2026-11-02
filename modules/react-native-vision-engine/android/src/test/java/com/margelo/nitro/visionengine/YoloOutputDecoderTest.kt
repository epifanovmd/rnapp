package com.margelo.nitro.visionengine

import org.junit.Assert.assertEquals
import org.junit.Test

class YoloOutputDecoderTest {
  /** Кандидатов в классическом выходе всегда кратно больше, чем каналов */
  private val anchors = 64

  /** Классический выход `[4 + nc, anchors]`: каналы первыми, остальные кандидаты пустые */
  private fun classic(candidates: List<FloatArray>, classes: Int): FloatArray {
    val channels = 4 + classes
    val values = FloatArray(channels * anchors)
    candidates.forEachIndexed { index, candidate ->
      for (channel in 0 until channels) {
        values[channel * anchors + index] = candidate[channel]
      }
    }
    return values
  }

  @Test
  fun decodesClassicOutputInPixels() {
    val values = classic(
      listOf(
        floatArrayOf(480f, 480f, 96f, 48f, 0.1f, 0.9f, 0f),
        floatArrayOf(100f, 100f, 20f, 20f, 0.1f, 0.1f, 0.2f),
      ),
      classes = 3,
    )

    val regions = YoloOutputDecoder.decode(values, 7, anchors, 960, 960, DetectorBoxUnits.AUTO, 0.35f, 0.45f)

    assertEquals(1, regions.size)
    assertEquals(1, regions[0].classIndex)
    assertEquals(0.45f, regions[0].x, 1e-4f)
    assertEquals(0.1f, regions[0].width, 1e-4f)
  }

  @Test
  fun honoursExplicitNormalizedUnits() {
    val values = classic(listOf(floatArrayOf(0.5f, 0.5f, 0.2f, 0.2f, 0.8f)), classes = 1)

    val regions = YoloOutputDecoder.decode(values, 5, anchors, 640, 640, DetectorBoxUnits.NORMALIZED, 0.35f, 0.45f)

    assertEquals(0.4f, regions[0].x, 1e-4f)
  }

  @Test
  fun suppressesOverlapsOnlyWithinClass() {
    val values = classic(
      listOf(
        floatArrayOf(0.5f, 0.5f, 0.2f, 0.2f, 0.9f, 0f),
        floatArrayOf(0.51f, 0.5f, 0.2f, 0.2f, 0.8f, 0f),
        floatArrayOf(0.5f, 0.5f, 0.2f, 0.2f, 0f, 0.7f),
      ),
      classes = 2,
    )

    val regions = YoloOutputDecoder.decode(values, 6, anchors, 640, 640, DetectorBoxUnits.AUTO, 0.35f, 0.45f)

    assertEquals(listOf(0, 1), regions.map { it.classIndex })
  }

  @Test
  fun decodesEndToEndOutput() {
    val values = floatArrayOf(
      64f, 64f, 128f, 128f, 0.9f, 2f,
      0f, 0f, 10f, 10f, 0.1f, 0f,
    )

    val regions = YoloOutputDecoder.decode(values, 2, 6, 640, 640, DetectorBoxUnits.AUTO, 0.35f, 0.45f)

    assertEquals(1, regions.size)
    assertEquals(2, regions[0].classIndex)
    assertEquals(0.1f, regions[0].width, 1e-4f)
  }

  @Test
  fun derivesClassCountFromShape() {
    assertEquals(6, YoloOutputDecoder.classCount(10, 18900))
    assertEquals(0, YoloOutputDecoder.classCount(300, 6))
    assertEquals(10 to 18900, YoloOutputDecoder.matrixShape(intArrayOf(1, 10, 18900)))
  }
}
