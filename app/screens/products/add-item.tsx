import AppLayout from "@/components/AppLayout";
import { Company, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ItemFormData {
  itemName: string;
  quantity: string;
}

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
  const [showItemSuggestions, setShowItemSuggestions] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [formData, setFormData] = useState<ItemFormData[]>([
    { itemName: "", quantity: "" },
    { itemName: "", quantity: "" },
    { itemName: "", quantity: "" },
    { itemName: "", quantity: "" },
    { itemName: "", quantity: "" },
  ]);

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
        // Since we're now in multi-add mode, we don't pre-fill for editing
        // This function is kept for reference but not used in current flow
        console.log("Item loaded:", item);
      }
    } catch (error) {
      console.error("Error loading item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    if (field === "itemName") {
      const updated = value.trimStart();
      const matches = allItemNames.filter(
        (name) =>
          name.toLowerCase().includes(updated.toLowerCase()) &&
          name.toLowerCase() !== updated.toLowerCase(),
      );
      setItemSuggestions(matches);
      const newShowSuggestions = [...showItemSuggestions];
      newShowSuggestions[index] = matches.length > 0 && updated.length > 0;
      setShowItemSuggestions(newShowSuggestions);
      setFormData((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], itemName: value.trimStart() };
        return updated;
      });
      return;
    }

    setFormData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSelectItemSuggestion = (index: number, itemName: string) => {
    setFormData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], itemName };
      return updated;
    });
    setItemSuggestions([]);
    const newShowSuggestions = [...showItemSuggestions];
    newShowSuggestions[index] = false;
    setShowItemSuggestions(newShowSuggestions);
  };

  const validateForm = (): boolean => {
    for (let i = 0; i < formData.length; i++) {
      const item = formData[i];
      // Skip empty rows
      if (!item.itemName.trim() && !item.quantity.trim()) {
        continue;
      }
      // If one is filled, both must be filled
      if (!item.itemName.trim()) {
        Alert.alert("Validation Error", `Row ${i + 1}: Item name is required`);
        return false;
      }
      const quantity = Number(item.quantity);
      if (
        !item.quantity.trim() ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        Alert.alert(
          "Validation Error",
          `Row ${i + 1}: Quantity must be a positive integer`,
        );
        return false;
      }
    }
    return true;
  };

  const handleClear = () => {
    setFormData([
      { itemName: "", quantity: "" },
      { itemName: "", quantity: "" },
      { itemName: "", quantity: "" },
      { itemName: "", quantity: "" },
      { itemName: "", quantity: "" },
    ]);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!companyId || typeof companyId !== "string") {
      Alert.alert("Error", "Invalid company");
      return;
    }

    setLoading(true);
    try {
      for (const item of formData) {
        // Skip empty rows
        if (!item.itemName.trim() || !item.quantity.trim()) {
          continue;
        }

        const quantity = Number(item.quantity);

        // Add new item
        const newItem = await storage.addItem({
          companyId,
          itemName: item.itemName.trim(),
          quantity,
        });

        // If in unload mode, automatically add to godown stock
        if (source === "unload" && company) {
          await storage.addGodownStock({
            itemId: newItem.id,
            godownName: company.godownName,
            loadedQuantity: quantity,
            vehicleNumber: "Received",
            date: company.date,
          });
        }
      }

      Alert.alert("Success", "Items added successfully", [
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
    } catch (error) {
      Alert.alert("Error", "Failed to save items. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title={`Add Items for ${company?.companyName || companyName || "Company"}`}
      isHome={false}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {formData.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.fieldContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter item name"
                placeholderTextColor={colors.textSecondary}
                value={item.itemName}
                onChangeText={(value) =>
                  handleInputChange(index, "itemName", value)
                }
                editable={!loading}
                autoFocus={index === 0 && !isEditing}
                onFocus={() => {
                  if (itemSuggestions.length > 0) {
                    const newShow = [...showItemSuggestions];
                    newShow[index] = true;
                    setShowItemSuggestions(newShow);
                  }
                }}
              />
              {showItemSuggestions[index] && itemSuggestions.length > 0 && (
                <View style={styles.autocompleteContainer}>
                  {itemSuggestions.map((name) => (
                    <TouchableOpacity
                      key={name}
                      style={styles.autocompleteOption}
                      onPress={() => handleSelectItemSuggestion(index, name)}
                    >
                      <Text style={styles.autocompleteOptionText}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                placeholderTextColor={colors.textSecondary}
                value={item.quantity}
                onChangeText={(value) =>
                  handleInputChange(index, "quantity", value)
                }
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={loading}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
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
              {loading ? "Saving..." : "Save Items"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 12,
  },
  fieldContainer: { marginBottom: 5 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
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
    paddingHorizontal: 16,
    marginHorizontal: -16,
    marginBottom: -16,
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
