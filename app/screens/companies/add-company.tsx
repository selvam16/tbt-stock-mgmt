import AppLayout from "@/components/AppLayout";
import { Company, Godown, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddCompanyScreen() {
  const router = useRouter();
  const { partyId, companyId, source = "add" } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [showGodownDropdown, setShowGodownDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing] = useState(!!companyId);
  const [allCompanyNames, setAllCompanyNames] = useState<string[]>([]);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [originalCompany, setOriginalCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    agentName: "",
    godownName: "",
    date: new Date(),
  });

  useEffect(() => {
    loadGodowns();
    loadCompanyNames();
    if (isEditing && companyId && typeof companyId === "string") {
      loadCompanyData(companyId);
    }
  }, [companyId, isEditing]);

  const loadCompanyNames = async () => {
    try {
      const companies = await storage.getCompanies();
      const uniqueNames = Array.from(
        new Set(companies.map((c) => c.companyName.trim()).filter(Boolean)),
      );
      setAllCompanyNames(uniqueNames);
    } catch (error) {
      console.error("Error loading company names:", error);
    }
  };

  const loadGodowns = async () => {
    try {
      const g = await storage.getGodowns();
      setGodowns(g);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCompanyData = async (id: string) => {
    try {
      const companies = await storage.getCompanies();
      const company = companies.find((c) => c.id === id);
      if (company) {
        setOriginalCompany(company);
        setFormData({
          companyName: company.companyName,
          agentName: company.agentName || "",
          godownName: company.godownName,
          date: new Date(company.date),
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load company data");
      console.error(error);
    }
  };

  const handleInputChange = (field: string, value: string | Date) => {
    if (field === "companyName" && typeof value === "string") {
      const updated = value.trimStart();
      const matches = allCompanyNames.filter(
        (name) =>
          name.toLowerCase().includes(updated.toLowerCase()) &&
          name.toLowerCase() !== updated.toLowerCase(),
      );
      setCompanySuggestions(matches);
      setShowCompanySuggestions(matches.length > 0 && updated.length > 0);
      setFormData((prev) => ({ ...prev, companyName: updated }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGodownSelect = (godown: Godown) => {
    setFormData((prev) => ({ ...prev, godownName: godown.name }));
    setShowGodownDropdown(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      handleInputChange("date", selectedDate);
    }
  };

  const handleClear = () => {
    setFormData({
      companyName: "",
      agentName: "",
      godownName: "",
      date: new Date(),
    });
    setShowGodownDropdown(false);
    setShowDatePicker(false);
    setShowCompanySuggestions(false);
  };

  const handleSelectCompanySuggestion = (companyName: string) => {
    setFormData((prev) => ({ ...prev, companyName }));
    setCompanySuggestions([]);
    setShowCompanySuggestions(false);
  };

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      Alert.alert("Validation Error", "Company name is required");
      return false;
    }
    if (!formData.godownName.trim()) {
      Alert.alert("Validation Error", "Godown name is required");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!partyId || typeof partyId !== "string") {
      Alert.alert("Error", "Invalid party");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && companyId && typeof companyId === "string") {
        // Check if godown changed
        const godownChanged =
          originalCompany && originalCompany.godownName !== formData.godownName;

        // Update existing company
        await storage.updateCompany(companyId, {
          companyName: formData.companyName.trim(),
          agentName: formData.agentName.trim() || undefined,
          godownName: formData.godownName.trim(),
          date: formData.date.toISOString().split("T")[0],
        });

        // If godown changed, update all GodownStock entries
        if (godownChanged && originalCompany) {
          // Get all items for this company
          const allItems = await storage.getItems();
          const companyItems = allItems.filter(
            (item) => item.companyId === companyId,
          );

          // For each item, move GodownStock from old godown to new godown
          for (const item of companyItems) {
            const godownStocks = await storage.getGodownStocks(item.id);
            const oldGodownStocks = godownStocks.filter(
              (s) => s.godownName === originalCompany.godownName,
            );

            for (const stock of oldGodownStocks) {
              // Delete old godown stock entry
              await storage.deleteGodownStock(stock.id);
              // Create new godown stock entry with same quantity
              await storage.addGodownStock({
                itemId: item.id,
                godownName: formData.godownName,
                loadedQuantity: stock.loadedQuantity,
                vehicleNumber: stock.vehicleNumber,
                date: stock.date,
              });
            }
          }
        }

        await loadCompanyNames();
        Alert.alert("Success", "Company updated successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        // Add new company
        await storage.addCompany({
          partyId,
          companyName: formData.companyName.trim(),
          agentName: formData.agentName.trim() || undefined,
          godownName: formData.godownName.trim(),
          date: formData.date.toISOString().split("T")[0],
          source: source as "add" | "unload",
        });
        await loadCompanyNames();
        Alert.alert("Success", "Company added successfully", [
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
      Alert.alert("Error", "Failed to save company. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title={isEditing ? "Edit Company" : "Add Company"}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Company Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              placeholderTextColor={colors.textSecondary}
              value={formData.companyName}
              onChangeText={(value) => handleInputChange("companyName", value)}
              editable={!loading}
              autoFocus={true}
              onFocus={() => {
                if (companySuggestions.length > 0)
                  setShowCompanySuggestions(true);
              }}
            />
            {showCompanySuggestions && companySuggestions.length > 0 && (
              <View style={styles.autocompleteContainer}>
                {companySuggestions.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={styles.autocompleteOption}
                    onPress={() => handleSelectCompanySuggestion(name)}
                  >
                    <Text style={styles.autocompleteOptionText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Agent Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Agent Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter agent name (optional)"
              placeholderTextColor={colors.textSecondary}
              value={formData.agentName}
              onChangeText={(value) => handleInputChange("agentName", value)}
              editable={!loading}
            />
          </View>

          {/* Godown Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Godown Name *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowGodownDropdown(!showGodownDropdown)}
              disabled={loading}
            >
              <Text style={styles.dropdownButtonText}>
                {formData.godownName || "Select godown"}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            {showGodownDropdown && (
              <View style={styles.dropdownMenu}>
                {godowns.map((godown) => (
                  <TouchableOpacity
                    key={godown.id}
                    style={[
                      styles.dropdownOption,
                      formData.godownName === godown.name &&
                        styles.dropdownOptionSelected,
                    ]}
                    onPress={() => handleGodownSelect(godown)}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        formData.godownName === godown.name &&
                          styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {godown.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Text style={{ color: colors.textPrimary }}>
                {formData.date.toDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
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
                  ? "Update Company"
                  : "Save Company"}
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
    maxHeight: 200,
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
