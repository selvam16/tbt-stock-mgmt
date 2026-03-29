import AddPartyFAB from "@/components/AddPartyFAB";
import AppLayout from "@/components/AppLayout";
import ItemCard from "@/components/ItemCard";
import { Item, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

export default function CompanyItemsScreen() {
  const router = useRouter();
  const { companyId, companyName } = useLocalSearchParams();
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
              />
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
      <AddPartyFAB onPress={handleAddItem} />
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
});
