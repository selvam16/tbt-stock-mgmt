import AppLayout from "@/components/AppLayout";
import GodownSummary from "@/components/GodownSummary";
import TransactionsList from "@/components/TransactionsList";
import { formatters } from "@/lib/formatters";
import { Company, GodownStock, Item, storage } from "@/lib/storage";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

interface TransactionDetail {
  stock: GodownStock;
  item: Item | null;
  company: Company | null;
  type: "load" | "unload";
}

export default function GodownDetailsScreen() {
  const { godownName } = useLocalSearchParams();
  const godownNameStr =
    typeof godownName === "string" ? godownName : godownName?.[0] || "";
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [totalUnloaded, setTotalUnloaded] = useState(0);

  const loadTransactions = useCallback(async () => {
    if (!godownNameStr) return;

    setLoading(true);
    try {
      const [allStocks, allItems, allCompanies] = await Promise.all([
        storage.getGodownStocks(),
        storage.getItems(),
        storage.getCompanies(),
      ]);

      // Filter stocks for this godown
      const godownStocks = allStocks.filter(
        (stock) => stock.godownName === godownNameStr,
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
  }, [godownNameStr]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  const handleDeleteTransaction = async (stockId: string) => {
    try {
      await storage.deleteGodownStock(stockId);
      Alert.alert(
        "Success",
        "Item removed from loaded items and moved to unload",
      );
      loadTransactions();
    } catch (error) {
      Alert.alert("Error", "Failed to remove item");
      console.error(error);
    }
  };

  const handleEditTransaction = async (
    stockId: string,
    newQuantity: number,
  ) => {
    try {
      // Get the stock to update
      const allStocks = await storage.getGodownStocks();
      const stockToUpdate = allStocks.find((s) => s.id === stockId);

      if (!stockToUpdate) {
        Alert.alert("Error", "Item not found");
        return;
      }

      // Update with new quantity (keep as negative for loaded items)
      const updatedStock = {
        ...stockToUpdate,
        loadedQuantity: -newQuantity, // Keep negative for load type
      };

      await storage.updateGodownStock(updatedStock);
      Alert.alert("Success", "Item quantity updated successfully");
      loadTransactions();
    } catch (error) {
      Alert.alert("Error", "Failed to update item quantity");
      console.error(error);
    }
  };

  return (
    <AppLayout
      title={`${formatters.label("GODOWN")}: ${formatters.godownName(godownNameStr)}`}
      hideClose={false}
      isHome={false}
    >
      <View style={styles.container}>
        <GodownSummary
          totalLoaded={totalLoaded}
          totalUnloaded={totalUnloaded}
        />
        <TransactionsList
          transactions={transactions}
          loading={loading}
          onDeleteTransaction={handleDeleteTransaction}
          onEditTransaction={handleEditTransaction}
        />
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
});
