import AppLayout from "@/components/AppLayout";
import { Company, GodownStock, Item, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface TransactionDetail {
  stock: GodownStock;
  item: Item | null;
  company: Company | null;
  type: "load" | "unload";
}

export default function GodownDetailsScreen() {
  const { godownName } = useLocalSearchParams();
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [totalUnloaded, setTotalUnloaded] = useState(0);

  const loadTransactions = useCallback(async () => {
    if (!godownName || typeof godownName !== "string") return;

    setLoading(true);
    try {
      const [allStocks, allItems, allCompanies] = await Promise.all([
        storage.getGodownStocks(),
        storage.getItems(),
        storage.getCompanies(),
      ]);

      // Filter stocks for this godown
      const godownStocks = allStocks.filter(
        (stock) => stock.godownName === godownName,
      );

      // Map to transaction details with company and item info
      const txns: TransactionDetail[] = godownStocks.map((stock) => {
        const item = allItems.find((i) => i.id === stock.itemId) || null;
        const company = item
          ? allCompanies.find((c) => c.id === item.companyId) || null
          : null;

        return {
          stock,
          item,
          company,
          type: stock.loadedQuantity < 0 ? "load" : "unload",
        };
      });

      // Sort by date descending (newest first)
      txns.sort(
        (a, b) =>
          new Date(b.stock.date).getTime() - new Date(a.stock.date).getTime(),
      );

      // Calculate totals
      let loaded = 0;
      let unloaded = 0;
      txns.forEach((txn) => {
        if (txn.type === "load") {
          loaded += Math.abs(txn.stock.loadedQuantity);
        } else {
          unloaded += txn.stock.loadedQuantity;
        }
      });

      setTransactions(txns);
      setTotalLoaded(loaded);
      setTotalUnloaded(unloaded);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [godownName]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  return (
    <AppLayout title={`Godown: ${godownName}`} hideClose={false}>
      <View style={styles.container}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Loaded</Text>
            <Text style={[styles.summaryValue, styles.loadedColor]}>
              {totalLoaded}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Unloaded</Text>
            <Text style={[styles.summaryValue, styles.unloadedColor]}>
              {totalUnloaded}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Current Stock</Text>
            <Text
              style={[
                styles.summaryValue,
                totalUnloaded + totalLoaded > 0
                  ? styles.positiveColor
                  : styles.negativeColor,
              ]}
            >
              {totalUnloaded + totalLoaded}
            </Text>
          </View>
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Transactions</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              No transactions for this godown
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.transactionCard,
                  item.type === "load" ? styles.loadCard : styles.unloadCard,
                ]}
              >
                <View style={styles.transactionHeader}>
                  <View style={styles.typeIndicator}>
                    <Text style={styles.typeText}>
                      {item.type === "load" ? "📦 LOAD" : "📋 UNLOAD"}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{item.stock.date}</Text>
                </View>

                <View style={styles.transactionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Company</Text>
                    <Text style={styles.detailValue}>
                      {item.company?.companyName || "Unknown"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Item</Text>
                    <Text style={styles.detailValue}>
                      {item.item?.itemName || "Unknown"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        item.type === "load"
                          ? styles.loadQuantity
                          : styles.unloadQuantity,
                      ]}
                    >
                      {item.type === "load" ? "-" : "+"}
                      {Math.abs(item.stock.loadedQuantity)}
                    </Text>
                  </View>

                  {item.stock.vehicleNumber && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Vehicle</Text>
                      <Text style={styles.detailValue}>
                        {item.stock.vehicleNumber}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            scrollEnabled={true}
          />
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
