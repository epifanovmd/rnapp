import { Col, ScrollView, Ticket } from "@components";
import { TabProps, useTransition } from "@core";
import React, { FC, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

const data = {
  eventTitle: "Футбольный матч",
  artist: "Спартак vs Зенит",
  date: "20 декабря 2024",
  time: "18:00",
  venue: "Стадион Лужники",
  row: "10",
  seat: "25",
  sector: "С",
  ticketNumber: "X1Y2-Z3W4-V5U6",
  price: "2500 ₽",
};

export const TicketTab: FC<TabProps> = memo(({ route }) => {
  const { navbarHeight } = useTransition();
  const topContent = (
    <View>
      <Text style={styles.title}>ЭЛЕКТРОННЫЙ БИЛЕТ</Text>
      <Text style={styles.event}>{data.eventTitle}</Text>
      <Text style={styles.artist}>{data.artist}</Text>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Дата:</Text>
          <Text style={styles.detailValue}>{data.date}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Время:</Text>
          <Text style={styles.detailValue}>{data.time}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Место:</Text>
          <Text style={styles.detailValue}>{data.venue}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Сектор:</Text>
          <Text style={styles.detailValue}>{data.sector}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ряд:</Text>
          <Text style={styles.detailValue}>{data.row}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Место:</Text>
          <Text style={styles.detailValue}>{data.seat}</Text>
        </View>
      </View>
    </View>
  );

  const bottomContent = (
    <View>
      <View style={styles.qrContainer}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>QR CODE</Text>
        </View>
        <Text style={styles.qrLabel}>Отсканируйте на входе</Text>
      </View>

      <View style={styles.ticketInfo}>
        <Text style={styles.ticketNumber}>№ {data.ticketNumber}</Text>
        <Text style={styles.ticketPrice}>Стоимость: {data.price}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView ph={16} gap={8} pt={navbarHeight}>
      <Ticket topContent={topContent} bottomContent={bottomContent} />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    color: "#495057",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  event: {
    fontSize: 10,
    textAlign: "center",
    color: "#6c757d",
    marginBottom: 2,
  },
  artist: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#212529",
    marginBottom: 16,
  },
  details: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 9,
    color: "#6c757d",
    flex: 1,
  },
  detailValue: {
    fontSize: 10,
    fontWeight: "600",
    color: "#212529",
    flex: 1,
    textAlign: "right",
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ced4da",
    marginBottom: 8,
  },
  qrText: {
    fontSize: 10,
    color: "#6c757d",
    fontWeight: "500",
  },
  qrLabel: {
    fontSize: 9,
    color: "#6c757d",
    textAlign: "center",
  },
  ticketInfo: {
    alignItems: "center",
  },
  ticketNumber: {
    fontSize: 10,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
    textAlign: "center",
  },
  ticketPrice: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#212529",
  },
});
