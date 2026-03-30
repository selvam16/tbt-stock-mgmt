import { Item, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QuantityInputModal from "./QuantityInputModal";

interface ItemCardProps {
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
  source?: "add" | "unload";
  vehicleId?: string;
}

export default function ItemCard({
  item,
  onEdit,
  onDelete,
  source = "add",
  vehicleId,
}: ItemCardProps) {
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete ${item.itemName}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await storage.deleteItem(item.id);
              onDelete();
              Alert.alert("Success", "Item deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete item");
              console.error(error);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleUpload = async (quantity: number) => {
    if (!vehicleId || vehicleId === "undefined") {
      Alert.alert(
        "Error",
        "Vehicle information is missing. Please go back and select a vehicle.",
      );
      return;
    }

    setLoading(true);
    try {
      // Get the company for this item to retrieve godown name
      const companies = await storage.getCompanies();
      const company = companies.find((c) => c.id === item.companyId);

      if (!company) {
        Alert.alert("Error", "Company not found");
        return;
      }

      // Get vehicle details for vehicle number
      const allVehicles = await storage.getVehicles();
      const vehicle = allVehicles.find((v) => v.id === vehicleId);

      if (!vehicle) {
        Alert.alert("Error", "Vehicle not found");
        return;
      }

      // Add to godown stock
      await storage.addGodownStock({
        itemId: item.id,
        godownName: company.godownName,
        loadedQuantity: quantity,
        vehicleNumber: vehicle.vehicleNumber,
        date: new Date().toISOString().split("T")[0],
      });

      Alert.alert(
        "Success",
        `Loaded ${quantity} units of ${item.itemName} to ${company.godownName}`,
      );
      setShowQuantityModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to load item");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.itemCard}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.itemName}</Text>
          <Text style={styles.detail}>Qty: {item.quantity}</Text>
        </View>
        <View style={styles.actions}>
          {source === "add" && (
            <TouchableOpacity
              style={[styles.uploadButton]}
              onPress={() => setShowQuantityModal(true)}
              disabled={loading}
            >
              <MaterialIcons name="upload" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {source !== "add" && (
            <>
              <TouchableOpacity
                style={styles.editButton}
                onPress={onEdit}
                disabled={loading}
              >
                <MaterialIcons name="edit" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={loading}
              >
                <MaterialIcons name="delete" size={20} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <QuantityInputModal
        visible={showQuantityModal}
        maxQuantity={item.quantity}
        itemName={item.itemName}
        onConfirm={handleUpload}
        onCancel={() => setShowQuantityModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  uploadButton: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButton: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
});
