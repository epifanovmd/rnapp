import { IScanDiagnostics } from "@shared/lib/ocr-scan";
import React, { FC, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

export interface IScanDiagnosticsBadgeProps {
  diagnostics: IScanDiagnostics;
}

/**
 * Dev-бейдж диагностики кадра поверх превью: латентность нативной
 * обработки, режим детектора и число результатов. Рендерится только
 * когда сканер отдал диагностику (она собирается лишь в __DEV__).
 */
export const ScanDiagnosticsBadge: FC<IScanDiagnosticsBadgeProps> = memo(
  ({ diagnostics }) => (
    <View style={styles.container} pointerEvents={"none"}>
      <Text style={styles.text}>
        {`${Math.round(diagnostics.durationMs)} мс · ${
          diagnostics.detectorUsed
            ? `детектор ${diagnostics.regionCount}`
            : "полный кадр"
        } · ${diagnostics.resultCount}`}
      </Text>
    </View>
  ),
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
