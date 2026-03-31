import AppLayout from "@/components/AppLayout";
import { Company, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddItemScreen() {
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
  const itemId =
    typeof params.itemId === "string" ? params.itemId : params.itemId?.[0];
  const source = (
    typeof params.source === "string" ? params.source : params.source?.[0]
  ) as "add" | "unload" | undefined;
  const [loading, setLoading] = useState(itemId ? true : false);
  const [company, setCompany] = useState<Company | null>(null);
  const [isEditing] = useState(!!itemId);
  const [allItemNames, setAllItemNames] = useState<string[]>([]);
  const [itemSuggestions, setItemSuggestions] = useState<string[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
  });

  useEffect(() => {
    loadItemNames();
    if (companyId && typeof companyId === "string") {
      loadCompany(companyId);
    }
    if (itemId && typeof itemId === "string") {
      loadItem(itemId);
    }
  }, [companyId, itemId]);

  const loadItemNames = async () => {
    try {
      const items = await storage.getItems();
      const uniqueNames = Array.from(
        new Set(items.map((i) => i.itemName.trim()).filter(Boolean)),
      );
      setAllItemNames(uniqueNames);
    } catch (error) {
      console.error("Error loading item names:", error);
    }
  };

  const loadCompany = async (id: string) => {
    try {
      const companies = await storage.getCompanies();
      const found = companies.find((c) => c.id === id);
      setCompany(found || null);
    } catch (error) {
      console.error("Error loading company:", error);
    }
  };

  const loadItem = async (id: string) => {
    try {
      const items = await storage.getItems();
      const item = items.find((i) => i.id === id);
      if (item) {
        setFormData({
          itemName: item.itemName,
          quantity: item.quantity.toString(),
        });
      }
    } catch (error) {
      console.error("Error loading item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "itemName") {
      const updated = value.trimStart();
      const matches = allItemNames.filter(
        (name) =>
          name.toLowerCase().includes(updated.toLowerCase()) &&
          name.toLowerCase() !== updated.toLowerCase(),
      );
      setItemSuggestions(matches);
      setShowItemSuggestions(matches.length > 0 && updated.length > 0);
      setFormData((prev) => ({ ...prev, itemName: updated }));
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectItemSuggestion = (itemName: string) => {
    setFormData((prev) => ({ ...prev, itemName }));
    setItemSuggestions([]);
    setShowItemSuggestions(false);
  };

  const validateForm = (): boolean => {
    if (!formData.itemName.trim()) {
      Alert.alert("Validation Error", "Item name is required");
      return false;
    }
    const quantity = Number(formData.quantity);
    if (
      !formData.quantity.trim() ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      Alert.alert("Validation Error", "Quantity must be a positive integer");
      return false;
    }
    return true;
  };

  const handleClear = () => {
    setFormData({ itemName: "", quantity: "" });
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!companyId || typeof companyId !== "string") {
      Alert.alert("Error", "Invalid company");
      return;
    }

    setLoading(true);
    try {
      const quantity = Number(formData.quantity);
      if (isEditing && itemId && typeof itemId === "string") {
        // Get original item for quantity difference
        const allItems = await storage.getItems();
        const originalItem = allItems.find((i) => i.id === itemId);
        const originalQuantity = originalItem?.quantity || 0;
        const quantityDifference = quantity - originalQuantity;

        // Update item
        await storage.updateItem(itemId, {
          itemName: formData.itemName.trim(),
          quantity,
        });

        // If in unload mode, update godown stock with quantity difference
        if (source === "unload" && company && quantityDifference !== 0) {
          // Find existing godown stock entry for this item
          const godownStocks = await storage.getGodownStocks(itemId);
          const existingStock = godownStocks.find(
            (s) => s.godownName === company.godownName,
          );

          if (existingStock) {
            // Update existing stock entry by deleting and recreating with new quantity
            await storage.deleteGodownStock(existingStock.id);
            await storage.addGodownStock({
              itemId: itemId,
              godownName: company.godownName,
              loadedQuantity: quantity, // Use new total quantity
              vehicleNumber: existingStock.vehicleNumber,
              date: existingStock.date,
            });
          } else if (quantityDifference > 0) {
            // If no existing stock but quantity increased, add new stock entry
            await storage.addGodownStock({
              itemId: itemId,
              godownName: company.godownName,
              loadedQuantity: quantityDifference,
              vehicleNumber: "Received",
              date: company.date,
            });
          }
        }

        Alert.alert("Success", "Item updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        // Add new item
        const newItem = await storage.addItem({
          companyId,
          itemName: formData.itemName.trim(),
          quantity,
        });

        // If in unload mode, automatically add to godown stock
        if (source === "unload" && company) {
          await storage.addGodownStock({
            itemId: newItem.id,
            godownName: company.godownName,
            loadedQuantity: quantity, // Positive: stock entering godown
            vehicleNumber: "Received",
            date: company.date,
          });
        }

        Alert.alert("Success", "Item added successfully", [
          {
            text: "Add More",
            onPress: () => handleClear(),
          },
          {
            text: "Done",
            onPress: () => router.back(),
            style: "cancel",
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save item. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title={
        isEditing
          ? "Edit Item"
          : `Add Item for ${company?.companyName || companyName || "Company"}`
      }
    >
      <View style={styles.container}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Item Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter item name"
            placeholderTextColor={colors.textSecondary}
            value={formData.itemName}
            onChangeText={(value) => handleInputChange("itemName", value)}
            editable={!loading}
            autoFocus={!isEditing}
            onFocus={() => {
              if (itemSuggestions.length > 0) setShowItemSuggestions(true);
            }}
          />
          {showItemSuggestions && itemSuggestions.length > 0 && (
            <View style={styles.autocompleteContainer}>
              {itemSuggestions.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.autocompleteOption}
                  onPress={() => handleSelectItemSuggestion(name)}
                >
                  <Text style={styles.autocompleteOptionText}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter quantity"
            placeholderTextColor={colors.textSecondary}
            value={formData.quantity}
            onChangeText={(value) => handleInputChange("quantity", value)}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={loading}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              loading && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading
                ? isEditing
                  ? "Updating..."
                  : "Saving..."
                : isEditing
                  ? "Update Item"
                  : "Save Item"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  fieldContainer: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  clearButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: { backgroundColor: colors.primary },
  saveButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  autocompleteContainer: {
    position: "relative",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.card,
    maxHeight: 150,
    marginTop: 4,
    zIndex: 999,
  },
  autocompleteOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  autocompleteOptionText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
});
