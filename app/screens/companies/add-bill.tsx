import AppLayout from "@/components/AppLayout";
import { Bill, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface BillFormData {
  isBillable: boolean;
  details: string;
  count: string;
  billDetails: string;
}

export default function AddBillScreen() {
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

  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BillFormData>({
    isBillable: false,
    details: "",
    count: "",
    billDetails: "",
  });

  useFocusEffect(
    useCallback(() => {
      if (companyId && typeof companyId === "string") {
        loadCompanyAndBills(companyId);
      }
    }, [companyId]),
  );

  const loadCompanyAndBills = async (id: string) => {
    try {
      setLoading(true);
      const fetched = await storage.getBills(id);
      setBills(fetched);
    } catch (error) {
      console.error("Error loading company and bills:", error);
      Alert.alert("Error", "Failed to load company details");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      isBillable: false,
      details: "",
      count: "",
      billDetails: "",
    });
    setEditingBillId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (bill: Bill) => {
    setFormData({
      isBillable: bill.isBillable,
      details: bill.details,
      count: bill.count,
      billDetails: bill.billDetails,
    });
    setEditingBillId(bill.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    if (!formData.details.trim()) {
      Alert.alert("Validation Error", "Details is required");
      return false;
    }
    if (!formData.count.trim()) {
      Alert.alert("Validation Error", "Count is required");
      return false;
    }
    const count = Number(formData.count);
    if (!Number.isInteger(count) || count <= 0) {
      Alert.alert("Validation Error", "Count must be a positive integer");
      return false;
    }
    if (!formData.billDetails.trim()) {
      Alert.alert("Validation Error", "Bill Details is required");
      return false;
    }
    return true;
  };

  const handleSaveBill = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (editingBillId) {
        // Update existing bill
        await storage.updateBill(editingBillId, {
          isBillable: formData.isBillable,
          details: formData.details.trim(),
          count: formData.count.trim(),
          billDetails: formData.billDetails.trim(),
        });
        Alert.alert("Success", "Bill updated successfully");
      } else {
        // Add new bill
        await storage.addBill({
          companyId: companyId as string,
          isBillable: formData.isBillable,
          details: formData.details.trim(),
          count: formData.count.trim(),
          billDetails: formData.billDetails.trim(),
        });
        Alert.alert("Success", "Bill added successfully");
      }

      // Refresh bills
      if (companyId && typeof companyId === "string") {
        await loadCompanyAndBills(companyId);
      }

      handleCloseModal();
    } catch (error) {
      Alert.alert("Error", "Failed to save bill");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = (bill: Bill) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this bill?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setLoading(true);
              await storage.deleteBill(bill.id);
              Alert.alert("Success", "Bill deleted successfully");
              if (companyId && typeof companyId === "string") {
                await loadCompanyAndBills(companyId);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete bill");
              console.error(error);
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading && bills.length === 0) {
    return (
      <AppLayout title="Bill Management" isHome={false}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Bills for ${companyName}`} isHome={false}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Manage Bills</Text>
          <Text style={styles.headerSubtext}>
            Add, edit or delete bills for this company
          </Text>
        </View>

        {bills.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No bills added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap &quot;Add Bill&quot; to create your first bill
            </Text>
          </View>
        ) : (
          bills.map((bill) => (
            <View key={bill.id} style={styles.billCard}>
              <View style={styles.billCardHeader}>
                <View style={styles.billInfo}>
                  <Text style={styles.billDetails}>{bill.details}</Text>
                  <View style={styles.billMeta}>
                    <Text style={styles.billMetaText}>
                      Count:{" "}
                      <Text style={styles.billMetaValue}>{bill.count}</Text>
                    </Text>
                    {bill.isBillable && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={styles.badgeText}>Billable</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.billReference}>
                <Text style={styles.referenceLabel}>Reference:</Text>
                <Text style={styles.referenceValue}>{bill.billDetails}</Text>
              </View>

              <View style={styles.billActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleOpenEditModal(bill)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteBill(bill)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={handleOpenAddModal}
        >
          <Text style={styles.addButtonText}>+ Add Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add/Edit Bill Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <AppLayout
          title={editingBillId ? "Edit Bill" : "Add New Bill"}
          isHome={false}
        >
          <ScrollView style={styles.modalContainer}>
            {/* Is Billable Toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Is Billable</Text>
              <Switch
                value={formData.isBillable}
                onValueChange={(value) =>
                  setFormData({ ...formData, isBillable: value })
                }
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor={formData.isBillable ? colors.primary : "#f4f3f4"}
              />
            </View>

            {/* Details Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bill details (e.g., Item name, description)"
                placeholderTextColor={colors.textSecondary}
                value={formData.details}
                onChangeText={(value) =>
                  setFormData({ ...formData, details: value })
                }
                multiline
                maxLength={100}
                editable={!loading}
                autoCapitalize="characters"
              />
              <Text style={styles.charCount}>
                {formData.details.length}/100
              </Text>
            </View>

            {/* Count Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Count</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter count (quantity)"
                placeholderTextColor={colors.textSecondary}
                value={formData.count}
                onChangeText={(value) =>
                  setFormData({ ...formData, count: value })
                }
                keyboardType="number-pad"
                maxLength={10}
                editable={!loading}
              />
            </View>

            {/* Bill Details Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bill Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bill details (reference, amount, etc)"
                placeholderTextColor={colors.textSecondary}
                value={formData.billDetails}
                onChangeText={(value) =>
                  setFormData({ ...formData, billDetails: value })
                }
                multiline
                maxLength={150}
                editable={!loading}
                autoCapitalize="characters"
              />
              <Text style={styles.charCount}>
                {formData.billDetails.length}/150
              </Text>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveBill}
              >
                <Text style={styles.saveButtonText}>
                  {editingBillId ? "Update" : "Add"} Bill
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </AppLayout>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  billCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  billCardHeader: {
    marginBottom: 12,
  },
  billInfo: {
    flex: 1,
  },
  billDetails: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  billMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  billMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  billMetaValue: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  billReference: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  referenceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },
  referenceValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  billActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  editButton: {
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  deleteButton: {
    borderColor: "#e74c3c",
    backgroundColor: "transparent",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e74c3c",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
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
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 40,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
  },
  modalButtonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
});
