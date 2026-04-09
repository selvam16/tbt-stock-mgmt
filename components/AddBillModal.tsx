import { colors } from "@/theme/color";
import { useEffect, useState } from "react";
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

interface AddBillModalProps {
  visible: boolean;
  companyName: string;
  onSave: (bills: BillFormData[]) => void;
  onCancel: () => void;
  initialBills?: BillFormData[];
}

export default function AddBillModal({
  visible,
  companyName,
  onSave,
  onCancel,
  initialBills,
}: AddBillModalProps) {
  const [bills, setBills] = useState<BillFormData[]>([
    { isBillable: true, details: "", count: "", billDetails: "" },
    { isBillable: true, details: "", count: "", billDetails: "" },
    { isBillable: true, details: "", count: "", billDetails: "" },
  ]);

  useEffect(() => {
    if (visible) {
      if (initialBills && initialBills.length > 0) {
        setBills(
          [
            ...initialBills,
            ...Array(3 - initialBills.length)
              .fill(null)
              .map(() => ({
                isBillable: true,
                details: "",
                count: "",
                billDetails: "",
              })),
          ].slice(0, 3),
        );
      } else {
        setBills([
          { isBillable: true, details: "", count: "", billDetails: "" },
          { isBillable: true, details: "", count: "", billDetails: "" },
          { isBillable: true, details: "", count: "", billDetails: "" },
        ]);
      }
    }
  }, [visible, initialBills]);

  const handleBillChange = (
    index: number,
    field: keyof BillFormData,
    value: any,
  ) => {
    const updatedBills = [...bills];
    if (field === "isBillable") {
      updatedBills[index].isBillable = value;
    } else {
      updatedBills[index] = {
        ...updatedBills[index],
        [field]: value,
      };
    }
    setBills(updatedBills);
  };

  const handleSave = () => {
    // Validate that at least one bill has some data
    const hasValidBill = bills.some(
      (bill) =>
        bill.details.trim() || bill.count.trim() || bill.billDetails.trim(),
    );

    if (!hasValidBill) {
      Alert.alert("Error", "Please add at least one bill detail");
      return;
    }

    onSave(bills);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Bill Details</Text>
            <Text style={styles.companyName}>{companyName}</Text>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={true}
          >
            {bills.map((bill, index) => (
              <View key={index} style={styles.billCard}>
                <Text style={styles.billNumber}>Bill {index + 1}</Text>

                {/* Checkbox - Is Billable */}
                <View style={styles.checkboxRow}>
                  <Text style={styles.label}>Is Billable</Text>
                  <Switch
                    value={bill.isBillable}
                    onValueChange={(value) =>
                      handleBillChange(index, "isBillable", value)
                    }
                    trackColor={{ false: "#767577", true: colors.primary }}
                    thumbColor={bill.isBillable ? colors.primary : "#f4f3f4"}
                  />
                </View>

                {/* Details Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Details</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter bill details (e.g., Item name, description)"
                    placeholderTextColor={colors.textSecondary}
                    value={bill.details}
                    onChangeText={(value) =>
                      handleBillChange(index, "details", value)
                    }
                    multiline
                    maxLength={100}
                  />
                  <Text style={styles.charCount}>
                    {bill.details.length}/100
                  </Text>
                </View>

                {/* Count Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Count</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter count (quantity)"
                    placeholderTextColor={colors.textSecondary}
                    value={bill.count}
                    onChangeText={(value) =>
                      handleBillChange(index, "count", value)
                    }
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>

                {/* Bill Details Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bill Details</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter bill details (reference, amount, etc)"
                    placeholderTextColor={colors.textSecondary}
                    value={bill.billDetails}
                    onChangeText={(value) =>
                      handleBillChange(index, "billDetails", value)
                    }
                    multiline
                    maxLength={150}
                  />
                  <Text style={styles.charCount}>
                    {bill.billDetails.length}/150
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Bills</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "50%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    marginBottom: 16,
  },
  billCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
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
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
});
