import AppLayout from "@/components/AppLayout";
import { Company, Godown, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CompanyFormData {
  companyName: string;
  agentName: string;
  godownName: string;
  date: Date;
}

export default function AddCompanyScreen() {
  const router = useRouter();
  const { partyId, companyId, source = "add" } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [showGodownDropdown, setShowGodownDropdown] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [showDatePicker, setShowDatePicker] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const isEditing = !!companyId;
  const [allCompanyNames, setAllCompanyNames] = useState<string[]>([]);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState<
    boolean[]
  >([false, false, false]);
  const [originalCompany, setOriginalCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData[]>([
    { companyName: "", agentName: "", godownName: "", date: new Date() },
    { companyName: "", agentName: "", godownName: "", date: new Date() },
    { companyName: "", agentName: "", godownName: "", date: new Date() },
  ]);

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
        // Pre-fill the form with the company data for editing
        const editDate = company.date
          ? new Date(company.date + "T00:00:00")
          : new Date();
        setFormData([
          {
            companyName: company.companyName,
            agentName: company.agentName || "",
            godownName: company.godownName,
            date: editDate,
          },
          { companyName: "", agentName: "", godownName: "", date: new Date() },
          { companyName: "", agentName: "", godownName: "", date: new Date() },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load company data");
      console.error(error);
    }
  };

  const handleInputChange = (
    index: number,
    field: string,
    value: string | Date,
  ) => {
    if (field === "companyName" && typeof value === "string") {
      const updated = value.trimStart();
      const matches = allCompanyNames.filter(
        (name) =>
          name.toLowerCase().includes(updated.toLowerCase()) &&
          name.toLowerCase() !== updated.toLowerCase(),
      );
      setCompanySuggestions(matches);
      const newShowSuggestions = [...showCompanySuggestions];
      newShowSuggestions[index] = matches.length > 0 && updated.length > 0;
      setShowCompanySuggestions(newShowSuggestions);
      setFormData((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], companyName: value.trimStart() };
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

  const handleGodownSelect = (index: number, godown: Godown) => {
    setFormData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], godownName: godown.name };
      return updated;
    });
    const newShowGodownDropdown = [...showGodownDropdown];
    newShowGodownDropdown[index] = false;
    setShowGodownDropdown(newShowGodownDropdown);
  };

  const handleDateChange = (index: number, event: any, selectedDate?: Date) => {
    const newShowDatePicker = [...showDatePicker];
    newShowDatePicker[index] = Platform.OS === "ios";
    setShowDatePicker(newShowDatePicker);
    if (selectedDate) {
      handleInputChange(index, "date", selectedDate);
    }
  };

  const handleClear = () => {
    setFormData([
      { companyName: "", agentName: "", godownName: "", date: new Date() },
      { companyName: "", agentName: "", godownName: "", date: new Date() },
      { companyName: "", agentName: "", godownName: "", date: new Date() },
    ]);
    setShowGodownDropdown([false, false, false]);
    setShowDatePicker([false, false, false]);
    setShowCompanySuggestions([false, false, false]);
  };

  const handleSelectCompanySuggestion = (
    index: number,
    companyName: string,
  ) => {
    setFormData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], companyName };
      return updated;
    });
    setCompanySuggestions([]);
    const newShowSuggestions = [...showCompanySuggestions];
    newShowSuggestions[index] = false;
    setShowCompanySuggestions(newShowSuggestions);
  };

  const validateForm = (): boolean => {
    for (let i = 0; i < formData.length; i++) {
      const company = formData[i];
      // Skip empty rows
      if (!company.companyName.trim() && !company.godownName.trim()) {
        continue;
      }
      // If one is filled, required fields must be filled
      if (!company.companyName.trim()) {
        Alert.alert(
          "Validation Error",
          `Row ${i + 1}: Company name is required`,
        );
        return false;
      }
      if (!company.godownName.trim()) {
        Alert.alert(
          "Validation Error",
          `Row ${i + 1}: Godown name is required`,
        );
        return false;
      }
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
      if (isEditing && originalCompany) {
        // Update existing company
        const firstCompany = formData[0];
        if (firstCompany.companyName.trim()) {
          await storage.updateCompany(originalCompany.id, {
            companyName: firstCompany.companyName.trim(),
            agentName: firstCompany.agentName.trim() || undefined,
            godownName: firstCompany.godownName.trim(),
            date: firstCompany.date.toISOString().split("T")[0],
          });
        }
        Alert.alert("Success", "Company updated successfully", [
          {
            text: "Done",
            onPress: () => router.back(),
            style: "cancel",
          },
        ]);
      } else {
        // Add new companies
        for (const company of formData) {
          // Skip empty rows
          if (!company.companyName.trim() || !company.godownName.trim()) {
            continue;
          }

          await storage.addCompany({
            partyId,
            companyName: company.companyName.trim(),
            agentName: company.agentName.trim() || undefined,
            godownName: company.godownName.trim(),
            date: company.date.toISOString().split("T")[0],
            source: source as "add" | "unload",
          });
        }

        await loadCompanyNames();
        Alert.alert("Success", "Companies added successfully", [
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
    <AppLayout
      title={isEditing ? "Edit Company" : "Add Companies"}
      isHome={false}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {formData.map((company, index) => (
          <View key={index} style={styles.card}>
            {/* Company Name Field */}
            <View style={styles.fieldContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter company name"
                placeholderTextColor={colors.textSecondary}
                value={company.companyName}
                onChangeText={(value) =>
                  handleInputChange(index, "companyName", value)
                }
                editable={!loading}
                autoFocus={index === 0}
                autoCapitalize="characters"
                onFocus={() => {
                  if (companySuggestions.length > 0) {
                    const newShow = [...showCompanySuggestions];
                    newShow[index] = true;
                    setShowCompanySuggestions(newShow);
                  }
                }}
              />
              {showCompanySuggestions[index] &&
                companySuggestions.length > 0 && (
                  <View style={styles.autocompleteContainer}>
                    {companySuggestions.map((name) => (
                      <TouchableOpacity
                        key={name}
                        style={styles.autocompleteOption}
                        onPress={() =>
                          handleSelectCompanySuggestion(index, name)
                        }
                      >
                        <Text style={styles.autocompleteOptionText}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
            </View>

            {/* Agent Name Field */}
            <View style={styles.fieldContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter agent name (optional)"
                placeholderTextColor={colors.textSecondary}
                value={company.agentName}
                onChangeText={(value) =>
                  handleInputChange(index, "agentName", value)
                }
                editable={!loading}
                autoCapitalize="characters"
              />
            </View>

            {/* Godown Name Field */}
            <View style={styles.fieldContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  const newShow = [...showGodownDropdown];
                  newShow[index] = !newShow[index];
                  setShowGodownDropdown(newShow);
                }}
                disabled={loading}
              >
                <Text style={styles.dropdownButtonText}>
                  {company.godownName || "Select godown"}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
              {showGodownDropdown[index] && (
                <View style={styles.dropdownMenu}>
                  {godowns.map((godown) => (
                    <TouchableOpacity
                      key={godown.id}
                      style={[
                        styles.dropdownOption,
                        company.godownName === godown.name &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() => handleGodownSelect(index, godown)}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          company.godownName === godown.name &&
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
              <TouchableOpacity
                style={styles.input}
                onPress={() => {
                  const newShow = [...showDatePicker];
                  newShow[index] = true;
                  setShowDatePicker(newShow);
                }}
                disabled={loading}
              >
                <Text style={{ color: colors.textPrimary }}>
                  {company.date.toDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker[index] && (
                <DateTimePicker
                  value={company.date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) =>
                    handleDateChange(index, event, selectedDate)
                  }
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>
        ))}

        {/* Footer with Buttons */}
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
              {loading ? "Saving..." : "Save Companies"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 12,
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
