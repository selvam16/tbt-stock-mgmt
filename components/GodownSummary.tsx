import { formatters } from "@/lib/formatters";
import { colors } from "@/theme/color";
import { StyleSheet, Text, View } from "react-native";

interface GodownSummaryProps {
  totalLoaded: number;
  totalUnloaded: number;
}

export default function GodownSummary({
  totalLoaded,
  totalUnloaded,
}: GodownSummaryProps) {
  const currentStock = totalUnloaded - totalLoaded;

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {formatters.label("TOTAL LOADED")}
        </Text>
        <Text style={[styles.summaryValue, styles.loadedColor]}>
          {totalLoaded}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {formatters.label("TOTAL UNLOADED")}
        </Text>
        <Text style={[styles.summaryValue, styles.unloadedColor]}>
          {totalUnloaded}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {formatters.label("CURRENT STOCK")}
        </Text>
        <Text
          style={[
            styles.summaryValue,
            currentStock > 0 ? styles.positiveColor : styles.negativeColor,
          ]}
        >
          {currentStock}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  loadedColor: {
    color: "#ef4444",
  },
  unloadedColor: {
    color: "#22c55e",
  },
  positiveColor: {
    color: "#22c55e",
  },
  negativeColor: {
    color: "#ef4444",
  },
});
