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
  const { companyId, companyName, itemId } = useLocalSearchParams();
  const [loading, setLoading] = useState(itemId ? true : false);
  const [company, setCompany] = useState<Company | null>(null);
  const [isEditing] = useState(!!itemId);
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
  });

  useEffect(() => {
    if (companyId && typeof companyId === "string") {
      loadCompany(companyId);
    }
    if (itemId && typeof itemId === "string") {
      loadItem(itemId);
    }
  }, [companyId, itemId]);

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
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        await storage.updateItem(itemId, {
          itemName: formData.itemName.trim(),
          quantity,
        });
        Alert.alert("Success", "Item updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await storage.addItem({
          companyId,
          itemName: formData.itemName.trim(),
          quantity,
        });
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
          />
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
});
