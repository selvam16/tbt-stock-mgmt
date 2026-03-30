import AppLayout from "@/components/AppLayout";
import { storage } from "@/lib/storage";
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

export default function AddVehicleScreen() {
  const router = useRouter();
  const { vehicleId, partyId } = useLocalSearchParams();
  const [loading, setLoading] = useState(vehicleId ? true : false);
  const [isEditing] = useState(!!vehicleId);
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    nameBoard: "",
    vehicleType: "Commercial",
    deliveryAt: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const vehicleTypes = ["Commercial", "Passenger", "Heavy", "Light", "Other"];

  useEffect(() => {
    if (vehicleId && typeof vehicleId === "string") {
      loadVehicleData(vehicleId);
    }
  }, [vehicleId]);

  const loadVehicleData = async (id: string) => {
    try {
      const allPartyId = partyId || "";
      const existingPartyId =
        typeof allPartyId === "string" ? allPartyId : allPartyId[0];
      const vehicles = await storage.getVehicles(existingPartyId);
      const vehicle = vehicles.find((v) => v.id === id);
      if (vehicle) {
        setFormData({
          vehicleNumber: vehicle.vehicleNumber,
          nameBoard: vehicle.nameBoard,
          vehicleType: vehicle.vehicleType,
          deliveryAt: vehicle.deliveryAt,
          date: vehicle.date,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load vehicle data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClear = () => {
    setFormData({
      vehicleNumber: "",
      nameBoard: "",
      vehicleType: "Commercial",
      deliveryAt: "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowTypeDropdown(false);
  };

  const validateForm = (): boolean => {
    if (!formData.vehicleNumber.trim()) {
      Alert.alert("Validation Error", "Vehicle number is required");
      return false;
    }
    if (!formData.nameBoard.trim()) {
      Alert.alert("Validation Error", "Name board is required");
      return false;
    }
    if (!formData.deliveryAt.trim()) {
      Alert.alert("Validation Error", "Delivery location is required");
      return false;
    }
    if (!formData.date.trim()) {
      Alert.alert("Validation Error", "Date is required");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const currentPartyId = partyId || "";
      const partyIdStr =
        typeof currentPartyId === "string" ? currentPartyId : currentPartyId[0];
      if (!partyIdStr && !isEditing) {
        Alert.alert("Error", "Party ID is required to add a vehicle");
        setLoading(false);
        return;
      }

      if (isEditing && vehicleId && typeof vehicleId === "string") {
        // Update existing vehicle
        await storage.updateVehicle(vehicleId, {
          vehicleNumber: formData.vehicleNumber.trim(),
          nameBoard: formData.nameBoard.trim(),
          vehicleType: formData.vehicleType,
          deliveryAt: formData.deliveryAt.trim(),
          date: formData.date.trim(),
        });
        Alert.alert("Success", "Vehicle updated successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        // Add new vehicle
        await storage.addVehicle({
          partyId: partyIdStr,
          vehicleNumber: formData.vehicleNumber.trim(),
          nameBoard: formData.nameBoard.trim(),
          vehicleType: formData.vehicleType,
          deliveryAt: formData.deliveryAt.trim(),
          date: formData.date.trim(),
        });
        Alert.alert("Success", "Vehicle added successfully", [
          {
            text: "Add More",
            onPress: () => {
              handleClear();
            },
          },
          {
            text: "Done",
            onPress: () => router.back(),
            style: "cancel",
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save vehicle. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title={isEditing ? "Edit Vehicle" : "Add Vehicle"}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Vehicle Number Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Vehicle Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., KA-01-AB-1234"
              placeholderTextColor={colors.textSecondary}
              value={formData.vehicleNumber}
              onChangeText={(value) =>
                handleInputChange("vehicleNumber", value)
              }
              editable={!loading}
              autoFocus={true}
            />
          </View>

          {/* Name Board Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Name Board *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name board details"
              placeholderTextColor={colors.textSecondary}
              value={formData.nameBoard}
              onChangeText={(value) => handleInputChange("nameBoard", value)}
              editable={!loading}
            />
          </View>

          {/* Vehicle Type Dropdown */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Vehicle Type *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              disabled={loading}
            >
              <Text style={styles.dropdownButtonText}>
                {formData.vehicleType}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            {showTypeDropdown && (
              <View style={styles.dropdownMenu}>
                {vehicleTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dropdownOption,
                      formData.vehicleType === type &&
                        styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, vehicleType: type }));
                      setShowTypeDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        formData.vehicleType === type &&
                          styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Delivery Location Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Delivery Location *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter delivery location"
              placeholderTextColor={colors.textSecondary}
              value={formData.deliveryAt}
              onChangeText={(value) => handleInputChange("deliveryAt", value)}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          </View>

          {/* Date Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={formData.date}
              onChangeText={(value) => handleInputChange("date", value)}
              editable={!loading}
            />
          </View>
        </View>

        {/* Footer with Buttons */}
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
                  ? "Update Vehicle"
                  : "Save Vehicle"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
  },
  content: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  textArea: {
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  dropdownIcon: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primary,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  dropdownOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
