import { formatters } from "@/lib/formatters";
import { Company, GodownStock, Item } from "@/lib/storage";
import { colors } from "@/theme/color";
import { StyleSheet, Text, View } from "react-native";

interface TransactionCardProps {
  stock: GodownStock;
  item: Item | null;
  company: Company | null;
  type: "load" | "unload";
}

export default function TransactionCard({
  stock,
  item,
  company,
  type,
}: TransactionCardProps) {
  return (
    <View
      style={[
        styles.transactionCard,
        type === "load" ? styles.loadCard : styles.unloadCard,
      ]}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.typeIndicator}>
          <Text style={styles.typeText}>
            {type === "load" ? "📦 LOAD" : "📋 UNLOAD"}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatters.date(stock.date)}</Text>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{formatters.label("COMPANY")}</Text>
          <Text style={styles.detailValue}>
            {formatters.companyName(company?.companyName || "Unknown")}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{formatters.label("ITEM")}</Text>
          <Text style={styles.detailValue}>
            {formatters.itemName(item?.itemName || "Unknown")}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{formatters.label("QUANTITY")}</Text>
          <Text
            style={[
              styles.detailValue,
              type === "load" ? styles.loadQuantity : styles.unloadQuantity,
            ]}
          >
            {type === "load" ? "-" : "+"}
            {Math.abs(stock.loadedQuantity)}
          </Text>
        </View>

        {stock.vehicleNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {formatters.label("VEHICLE")}
            </Text>
            <Text style={styles.detailValue}>
              {formatters.vehicleNumber(stock.vehicleNumber)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  transactionCard: {
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderLeftWidth: 4,
  },
  loadCard: {
    backgroundColor: "#fee2e2",
    borderLeftColor: "#ef4444",
  },
  unloadCard: {
    backgroundColor: "#dcfce7",
    borderLeftColor: "#22c55e",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionDetails: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  loadQuantity: {
    color: "#ef4444",
    fontWeight: "700",
  },
  unloadQuantity: {
    color: "#22c55e",
    fontWeight: "700",
  },
});
