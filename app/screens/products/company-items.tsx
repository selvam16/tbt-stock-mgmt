import AppLayout from "@/components/AppLayout";
import ItemCard from "@/components/ItemCard";
import { Item, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CompanyItemsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyId =
    typeof params.companyId === "string"
      ? params.companyId
      : params.companyId?.[0];
  const companyName =
    typeof params.companyName === "string"
      ? params.companyName
      : params.companyName?.[0];
  const vehicleId =
    typeof params.vehicleId === "string"
      ? params.vehicleId
      : params.vehicleId?.[0];
  const source = (
    typeof params.source === "string"
      ? params.source
      : params.source?.[0] || "add"
  ) as "add" | "unload";
  console.log("CompanyItemsScreen params:", { companyId, companyName, vehicleId, source, params });
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    if (!companyId || typeof companyId !== "string") return;
    setLoading(true);
    try {
      const data = await storage.getItems(companyId);
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const handleAddItem = () => {
    if (!companyId || typeof companyId !== "string") {
      Alert.alert("Error", "Invalid company");
      return;
    }
    router.push({
      pathname: "/screens/products/add-item",
      params: { companyId, companyName },
    });
  };

  const handleEditItem = (itemId: string) => {
    if (!companyId || typeof companyId !== "string") return;
    router.push({
      pathname: "/screens/products/add-item",
      params: { companyId, companyName, itemId },
    });
  };

  const handleItemDeleted = () => {
    loadItems();
  };

  if (loading) {
    return (
      <AppLayout title={`Items for ${companyName || "Company"}`}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Items for ${companyName || "Company"}`}>
      <View style={styles.container}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items added yet.</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add an item.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onEdit={() => handleEditItem(item.id)}
                onDelete={handleItemDeleted}
                vehicleId={vehicleId as string}
                source={source as "add" | "unload"}
              />
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
      {source !== "add" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddItem}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: { padding: 16 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
