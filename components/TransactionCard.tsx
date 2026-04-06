import { formatters } from "@/lib/formatters";
import { Company, GodownStock, Item, Party } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TransactionCardProps {
  stock: GodownStock;
  item: Item | null;
  company: Company | null;
  party: Party | null;
  type: "load" | "unload";
  onDelete?: (stockId: string) => void;
  onEdit?: (stockId: string, newQuantity: number) => void;
}

export default function TransactionCard({
  stock,
  item,
  company,
  party,
  type,
  onDelete,
  onEdit,
}: TransactionCardProps) {
  const handleDelete = () => {
    if (type !== "load") return; // Only allow delete for loaded items

    Alert.alert(
      "Remove Loaded Item",
      `Are you sure you want to remove ${item?.itemName || "this item"} from the loaded items? It will be moved back to unload stock.`,
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: () => {
            onDelete?.(stock.id);
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleEdit = () => {
    if (type !== "load") return; // Only allow edit for loaded items

    const currentQty = Math.abs(stock.loadedQuantity);
    Alert.prompt(
      "Edit Loaded Quantity",
      `Enter new quantity for ${item?.itemName || "this item"}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Update",
          onPress: (newQtyStr: string | undefined) => {
            if (!newQtyStr) return;
            const newQty = Number(newQtyStr);
            if (!Number.isInteger(newQty) || newQty <= 0) {
              Alert.alert("Error", "Quantity must be a positive integer");
              return;
            }
            if (newQty > 1000) {
              Alert.alert("Error", "Quantity cannot exceed 1000");
              return;
            }
            onEdit?.(stock.id, newQty);
          },
        },
      ],
      "plain-text",
      currentQty.toString(),
      "numeric",
    );
  };
  return (
    <View
      style={[
        styles.transactionCard,
        type === "load" ? styles.loadCard : styles.unloadCard,
      ]}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.typeIndicator}>
          <Text style={styles.typeText}>
            {type === "load" ? "📦 LOAD" : "📋 UNLOAD"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.dateText}>{formatters.date(stock.date)}</Text>
          {/* {type === "load" && (onEdit || onDelete) && (
            <View style={styles.actionButtons}>
              {onEdit && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEdit}
                >
                  <MaterialIcons name="edit" size={18} color="#2563eb" />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <MaterialIcons name="close" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          )} */}
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{formatters.label("PARTY")}</Text>
          <Text style={styles.detailValue}>{party?.name || "Unknown"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{formatters.label("COMPANY")}</Text>
          <Text style={styles.detailValue}>
            {formatters.companyName(company?.companyName || "Unknown")}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{formatters.label("ITEM")}</Text>
          <Text style={styles.detailValue}>
            {formatters.itemName(item?.itemName || "Unknown")}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{formatters.label("QUANTITY")}</Text>
          <Text
            style={[
              styles.detailValue,
              type === "load" ? styles.loadQuantity : styles.unloadQuantity,
            ]}
          >
            {type === "load" ? "-" : "+"}
            {Math.abs(stock.loadedQuantity)}
          </Text>
        </View>

        {stock.vehicleNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {formatters.label("VEHICLE")}
            </Text>
            <Text style={styles.detailValue}>
              {formatters.vehicleNumber(stock.vehicleNumber)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  transactionCard: {
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderLeftWidth: 4,
  },
  loadCard: {
    backgroundColor: "#fee2e2",
    borderLeftColor: "#ef4444",
  },
  unloadCard: {
    backgroundColor: "#dcfce7",
    borderLeftColor: "#22c55e",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionDetails: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  loadQuantity: {
    color: "#ef4444",
    fontWeight: "700",
  },
  unloadQuantity: {
    color: "#22c55e",
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  editButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
