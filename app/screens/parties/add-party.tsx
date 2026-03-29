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

export default function AddPartyScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams();
  const [loading, setLoading] = useState(partyId ? true : false);
  const [isEditing] = useState(!!partyId);
  const [formData, setFormData] = useState({
    title: "MR",
    name: "",
    contact: "",
    city: "",
    address: "",
  });
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);

  useEffect(() => {
    if (partyId && typeof partyId === "string") {
      loadPartyData(partyId);
    }
  }, [partyId]);

  const loadPartyData = async (id: string) => {
    try {
      const parties = await storage.getParties();
      const party = parties.find((p) => p.id === id);
      if (party) {
        setFormData({
          title: party.title,
          name: party.name,
          contact: party.contact,
          city: party.city,
          address: party.address,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load party data");
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
      title: "MR",
      name: "",
      contact: "",
      city: "",
      address: "",
    });
    setShowTitleDropdown(false);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Party name is required");
      return false;
    }
    if (formData.contact.trim() && !/^\d{10}$/.test(formData.contact)) {
      Alert.alert(
        "Validation Error",
        "Contact number must be exactly 10 digits",
      );
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert("Validation Error", "City is required");
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert("Validation Error", "Address is required");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEditing && partyId && typeof partyId === "string") {
        // Update existing party
        await storage.updateParty(partyId, {
          title: formData.title,
          name: formData.name.trim(),
          contact: formData.contact.trim(),
          city: formData.city.trim(),
          address: formData.address.trim(),
        });
        Alert.alert("Success", "Party updated successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        // Add new party
        await storage.addParty({
          title: formData.title,
          name: formData.name.trim(),
          contact: formData.contact.trim(),
          city: formData.city.trim(),
          address: formData.address.trim(),
        });
        Alert.alert("Success", "Party added successfully", [
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
      Alert.alert("Error", "Failed to save party. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title={isEditing ? "Edit Party" : "Add Party"}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Title Dropdown */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Title *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTitleDropdown(!showTitleDropdown)}
              disabled={loading}
            >
              <Text style={styles.dropdownButtonText}>{formData.title}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            {showTitleDropdown && (
              <View style={styles.dropdownMenu}>
                {["MR", "M/S"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownOption,
                      formData.title === option &&
                        styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, title: option }));
                      setShowTitleDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        formData.title === option &&
                          styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Party Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter party name"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              editable={!loading}
              autoFocus={true}
            />
          </View>

          {/* Address Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter address"
              placeholderTextColor={colors.textSecondary}
              value={formData.address}
              onChangeText={(value) => handleInputChange("address", value)}
              multiline
              numberOfLines={8}
              editable={!loading}
            />
          </View>

          {/* City Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              placeholderTextColor={colors.textSecondary}
              value={formData.city}
              onChangeText={(value) => handleInputChange("city", value)}
              editable={!loading}
            />
          </View>

          {/* Contact Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter contact number"
              placeholderTextColor={colors.textSecondary}
              value={formData.contact}
              onChangeText={(value) => handleInputChange("contact", value)}
              keyboardType="phone-pad"
              maxLength={10}
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
                  ? "Update Party"
                  : "Save Party"}
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
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  textArea: {
    minHeight: 120,
    paddingVertical: 12,
    textAlignVertical: "top",
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
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
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
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
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
  },
  dropdownIcon: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
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
});
