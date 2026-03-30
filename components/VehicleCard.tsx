import { Vehicle, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VehicleCardProps {
  vehicle: Vehicle;
  onDelete: () => void;
  source?: "add" | "unload";
}

export default function VehicleCard({
  vehicle,
  onDelete,
  source = "add",
}: VehicleCardProps) {
  const router = useRouter();

  const handleDelete = () => {
    Alert.alert(
      "Delete Vehicle",
      `Are you sure you want to delete ${vehicle.vehicleNumber}?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await storage.deleteVehicle(vehicle.id);
              onDelete();
              Alert.alert("Success", "Vehicle deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete vehicle");
              console.error(error);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: "/screens/vehicles/add-vehicle",
      params: { vehicleId: vehicle.id },
    });
  };

  const handleCardPress = () => {
    router.push({
      pathname: "/screens/companies/company-lists",
      params: { partyId: vehicle.partyId, vehicleId: vehicle.id, source },
    });
  };

  return (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleNumber}>🚚 {vehicle.vehicleNumber}</Text>
        <Text style={styles.vehicleDetail}>📋 {vehicle.nameBoard}</Text>
        <Text style={styles.vehicleDetail}>📦 Type: {vehicle.vehicleType}</Text>
        <Text style={styles.vehicleDetail}>📍 {vehicle.deliveryAt}</Text>
        <Text style={styles.vehicleDetail}>📅 {vehicle.date}</Text>
      </View>
      {source !== "add" && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <MaterialIcons name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <MaterialIcons name="delete" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  vehicleCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "column",
    gap: 10,
  },
  vehicleInfo: {
    flex: 1,
    gap: 6,
  },
  vehicleNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  vehicleDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
});
