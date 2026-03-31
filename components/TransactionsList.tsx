import { formatters } from "@/lib/formatters";
import { Company, GodownStock, Item } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TransactionCard from "./TransactionCard";

interface TransactionDetail {
  stock: GodownStock;
  item: Item | null;
  company: Company | null;
  type: "load" | "unload";
}

interface TransactionsListProps {
  transactions: TransactionDetail[];
  loading: boolean;
}

export default function TransactionsList({
  transactions,
  loading,
}: TransactionsListProps) {
  const [activeTab, setActiveTab] = useState<"load" | "unload" | "all">("all");

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Filter transactions by active tab
  const filteredTransactions =
    activeTab === "all"
      ? transactions
      : transactions.filter((txn) => txn.type === activeTab);

  if (transactions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No transactions for this godown</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>
        {formatters.label("TRANSACTIONS")}
      </Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["load", "unload", "all"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab as "load" | "unload" | "all")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {formatters.label(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtered Transactions */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab === "all" ? "" : activeTab} transactions
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <TransactionCard
              stock={item.stock}
              item={item.item}
              company={item.company}
              type={item.type}
            />
          )}
          scrollEnabled={true}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
