import { Godown, GodownStock, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppLayout from "../components/AppLayout";

interface GodownWithQuantity extends Godown {
  totalQuantity: number;
}

export default function Home() {
  const router = useRouter();
  const [godowns, setGodowns] = useState<GodownWithQuantity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGodownsWithQuantities = useCallback(async () => {
    setLoading(true);
    try {
      const [godownsData, godownStocks] = await Promise.all([
        storage.getGodowns(),
        storage.getGodownStocks(),
      ]);

      // Calculate total quantity for each godown
      const quantityMap = new Map<string, number>();
      godownStocks.forEach((stock: GodownStock) => {
        const current = quantityMap.get(stock.godownName) || 0;
        quantityMap.set(stock.godownName, current + stock.loadedQuantity);
      });

      // Merge godown data with quantities
      const godownsWithQuantity: GodownWithQuantity[] = godownsData.map(
        (godown: Godown) => ({
          ...godown,
          totalQuantity: quantityMap.get(godown.name) || 0,
        }),
      );

      setGodowns(godownsWithQuantity);
    } catch (error) {
      console.error("Error loading godowns:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGodownsWithQuantities();
    }, [loadGodownsWithQuantities]),
  );

  return (
    <AppLayout
      title="Dashboard"
      hideClose
      footer={
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.button, styles.loadBtn]}
            onPress={() => router.push("/screens/load")}
          >
            <Text style={styles.buttonText}>LOAD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.unloadBtn]}
            onPress={() => router.push("/screens/unload")}
          >
            <Text style={styles.buttonText}>UNLOAD</Text>
          </TouchableOpacity>
        </View>
      }
    >
      {/* STOCK */}
      <Text style={styles.sectionTitle}>Godowns</Text>
      <TouchableOpacity
        onPress={() => storage.downloadJSON()}
        style={{ marginBottom: 12 }}
      >
        <Text style={{ color: colors.primary }}>Download Data</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loading}>
          <Text>Loading godowns...</Text>
        </View>
      ) : godowns.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No godowns found.</Text>
        </View>
      ) : (
        <FlatList
          data={godowns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/screens/godowns/godown-details",
                  params: { godownName: item.name },
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.godownInfo}>
                    <Text style={styles.godownId}>ID: {item.id}</Text>
                    <Text style={styles.godownName}>{item.name}</Text>
                  </View>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Total Qty</Text>
                    <Text style={styles.quantityValue}>
                      {item.totalQuantity}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  marginTop: {
    marginTop: 20,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  godownInfo: {
    flex: 1,
  },
  godownId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  godownName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  quantityContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  quantityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  empty: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerContainer: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
  },
  loadBtn: {
    backgroundColor: colors.load,
    marginRight: 5,
  },
  unloadBtn: {
    backgroundColor: colors.unload,
  },
  buttonText: {
    textAlign: "center",
    color: colors.textPrimary,
    fontWeight: "bold",
  },
});
