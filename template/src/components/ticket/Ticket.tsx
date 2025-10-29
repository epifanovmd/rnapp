import React, { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Defs, Mask, Rect } from "react-native-svg";

interface ElectronicTicketProps {
  topContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
}

export const Ticket: React.FC<ElectronicTicketProps> = ({
  topContent,
  bottomContent,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const ticketWidth = Math.min(screenWidth - 36, 260);

  const [topHeight, setTopHeight] = useState(0);
  const [bottomHeight, setBottomHeight] = useState(0);

  const notchRadius = 10;
  const cornerRadius = 16;
  const dashWidth = 4;
  const gapWidth = 4;

  // Общая высота билета = высота верхней части + высота нижней части
  const ticketHeight = topHeight + bottomHeight;
  // Позиция линии разделения (на стыке двух частей)
  const dashY = topHeight;

  const dashStartX = notchRadius;
  const dashEndX = ticketWidth - notchRadius;
  const dashLength = dashEndX - dashStartX;
  const dashCount = Math.floor(dashLength / (dashWidth + gapWidth));

  return (
    <View style={styles.container}>
      <Svg width={ticketWidth} height={ticketHeight}>
        <Defs>
          <Mask id="ticketMask">
            <Rect
              width={ticketWidth}
              height={ticketHeight}
              rx={cornerRadius}
              fill="white"
            />

            {/* Левый вырез на уровне линии разделения */}
            <Rect
              x={-notchRadius}
              y={dashY - notchRadius}
              width={notchRadius * 2}
              height={notchRadius * 2}
              rx={notchRadius}
              fill="black"
            />

            {/* Правый вырез на уровне линии разделения */}
            <Rect
              x={ticketWidth - notchRadius}
              y={dashY - notchRadius}
              width={notchRadius * 2}
              height={notchRadius * 2}
              rx={notchRadius}
              fill="black"
            />
          </Mask>

          <Mask id="dashMask">
            {Array.from({ length: dashCount }).map((_, index) => (
              <Rect
                key={index}
                x={dashStartX + index * (dashWidth + gapWidth)}
                y={dashY - 1}
                width={dashWidth}
                height={1}
                fill="white"
              />
            ))}
          </Mask>
        </Defs>

        <Rect
          width={ticketWidth}
          height={ticketHeight}
          rx={cornerRadius}
          fill="#f8f9fa"
          mask="url(#ticketMask)"
        />

        <Rect
          width={dashLength}
          x={dashStartX}
          height={2}
          y={dashY - 1}
          fill="#6c757d"
          mask="url(#dashMask)"
        />
      </Svg>

      {/* Контент билета */}
      <View style={[styles.contentContainer, { width: ticketWidth }]}>
        {/* Верхняя часть */}
        <View
          style={styles.topSection}
          onLayout={event => {
            const { height } = event.nativeEvent.layout;

            setTopHeight(height);
          }}
        >
          {topContent}
        </View>

        {/* Нижняя часть */}
        <View
          style={styles.bottomSection}
          onLayout={event => {
            const { height } = event.nativeEvent.layout;

            setBottomHeight(height);
          }}
        >
          {bottomContent}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  contentContainer: {
    position: "absolute",
  },
  topSection: {
    padding: 16,
    paddingBottom: 24,
  },
  bottomSection: {
    padding: 16,
    paddingTop: 24,
  },
});
