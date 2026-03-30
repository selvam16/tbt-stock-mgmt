import { colors } from "@/theme/color";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface QuantityInputModalProps {
  visible: boolean;
  maxQuantity: number;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
  itemName: string;
}

export default function QuantityInputModal({
  visible,
  maxQuantity,
  onConfirm,
  onCancel,
  itemName,
}: QuantityInputModalProps) {
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (visible) {
      setQuantity("");
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!quantity.trim()) {
      Alert.alert("Error", "Please enter a quantity");
      return;
    }

    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      Alert.alert("Error", "Quantity must be a positive integer");
      return;
    }

    if (parsedQty > maxQuantity) {
      Alert.alert(
        "Error",
        `Quantity cannot exceed ${maxQuantity} (available quantity)`,
      );
      return;
    }

    onConfirm(parsedQty);
    setQuantity("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Load Quantity</Text>
          <Text style={styles.itemName}>{itemName}</Text>
          <Text style={styles.subtitle}>
            Available: {maxQuantity} {maxQuantity === 1 ? "unit" : "units"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter quantity to load"
            placeholderTextColor={colors.textSecondary}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            maxLength={9}
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Load</Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
