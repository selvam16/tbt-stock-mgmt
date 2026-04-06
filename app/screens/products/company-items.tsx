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
  const partyId =
    typeof params.partyId === "string" ? params.partyId : params.partyId?.[0];
  const vehicleId =
    typeof params.vehicleId === "string"
      ? params.vehicleId
      : params.vehicleId?.[0];
  const source = (
    typeof params.source === "string"
      ? params.source
      : params.source?.[0] || "add"
  ) as "add" | "unload";
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

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
      params: { companyId, companyName, source },
    });
  };

  const handleEditItem = (itemId: string) => {
    if (!companyId || typeof companyId !== "string") return;
    router.push({
      pathname: "/screens/products/add-item",
      params: { companyId, companyName, itemId, source },
    });
  };

  const handleItemDeleted = () => {
    loadItems();
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length && items.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)));
    }
  };

  const handleBulkLoad = async () => {
    if (selectedItems.size === 0) {
      Alert.alert("Error", "Please select at least one item to load");
      return;
    }

    if (!vehicleId || vehicleId === "undefined") {
      Alert.alert(
        "Error",
        "Vehicle information is missing. Please go back and select a vehicle.",
      );
      return;
    }

    const selectedItemObjects = items.filter((item) =>
      selectedItems.has(item.id),
    );
    const itemsWithZeroQty = selectedItemObjects.filter(
      (item) => item.quantity <= 0,
    );

    if (itemsWithZeroQty.length > 0) {
      Alert.alert(
        "Error",
        `Cannot load items with zero or negative quantity: ${itemsWithZeroQty.map((i) => i.itemName).join(", ")}`,
      );
      return;
    }

    Alert.alert(
      "Confirm Load",
      `Load ${selectedItems.size} item(s) with full quantities to the vehicle?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load All",
          onPress: async () => {
            setBulkLoading(true);
            try {
              const companies = await storage.getCompanies();
              const allVehicles = await storage.getVehicles(partyId);
              const vehicle = allVehicles.find((v) => v.id === vehicleId);

              if (!vehicle) {
                Alert.alert("Error", "Vehicle not found");
                return;
              }

              let successCount = 0;
              for (const item of selectedItemObjects) {
                const company = companies.find((c) => c.id === item.companyId);

                if (!company) continue;

                const quantity = item.quantity;

                // Add to godown stock
                await storage.addGodownStock({
                  itemId: item.id,
                  godownName: company.godownName,
                  loadedQuantity: -quantity,
                  vehicleNumber: vehicle.vehicleNumber,
                  date: vehicle.date,
                });

                // Update item quantity to 0
                await storage.updateItem(item.id, {
                  itemName: item.itemName,
                  quantity: 0,
                });

                successCount++;
              }

              Alert.alert(
                "Success",
                `Loaded ${successCount} item(s) to the vehicle.`,
              );
              setSelectedItems(new Set());
              loadItems();
            } catch (error) {
              Alert.alert("Error", "Failed to load items");
              console.error(error);
            } finally {
              setBulkLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <AppLayout title={`Items for ${companyName || "Company"}`} isHome={false}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Items for ${companyName || "Company"}`} isHome={false}>
      <View style={styles.container}>
        {source === "add" && items.length > 0 && (
          <View style={styles.selectAllContainer}>
            <View style={styles.selectAllCheckbox}>
              <TouchableOpacity
                onPress={handleSelectAll}
                disabled={bulkLoading}
                style={styles.checkboxTouchable}
              >
                <MaterialIcons
                  name={
                    selectedItems.size === items.length && items.length > 0
                      ? "check-box"
                      : "check-box-outline-blank"
                  }
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.selectAllText}>
                Select All ({selectedItems.size}/{items.length})
              </Text>
            </View>
          </View>
        )}
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
                partyId={partyId as string}
                source={source as "add" | "unload"}
                isSelected={selectedItems.has(item.id)}
                onToggleSelect={
                  source === "add"
                    ? () => toggleItemSelection(item.id)
                    : undefined
                }
              />
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
      {source === "add" && selectedItems.size > 0 && (
        <TouchableOpacity
          style={styles.bulkLoadButton}
          onPress={handleBulkLoad}
          disabled={bulkLoading}
          activeOpacity={0.7}
        >
          <MaterialIcons name="cloud-upload" size={24} color="#fff" />
          <Text style={styles.bulkLoadText}>
            Load {selectedItems.size} Item{selectedItems.size !== 1 ? "s" : ""}
          </Text>
        </TouchableOpacity>
      )}
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
  selectAllContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectAllCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkboxTouchable: {
    padding: 4,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  bulkLoadButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    left: 20,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    gap: 8,
  },
  bulkLoadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
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
