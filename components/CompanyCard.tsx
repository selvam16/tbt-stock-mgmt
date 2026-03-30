import { Company, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CompanyCardProps {
  company: Company;
  totalQuantity?: number;
  onDelete: () => void;
  onEdit: () => void;
  source?: "add" | "unload";
  showActions?: boolean;
  vehicleId?: string;
}

export default function CompanyCard({
  company,
  totalQuantity = 0,
  onDelete,
  onEdit,
  source = "add",
  showActions = true,
  vehicleId,
}: CompanyCardProps) {
  const router = useRouter();

  const handleCardPress = () => {
    router.push({
      pathname: "/screens/products/company-items",
      params: {
        companyId: company.id,
        companyName: company.companyName,
        vehicleId: vehicleId,
        source,
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Company",
      `Are you sure you want to delete ${company.companyName}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await storage.deleteCompany(company.id);
              onDelete();
              Alert.alert("Success", "Company deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete company");
              console.error(error);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={styles.companyItem}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{company.companyName}</Text>
        {company.agentName ? (
          <Text style={styles.companyDetail}>Agent: {company.agentName}</Text>
        ) : null}
        <Text style={styles.companyDetail}>Godown: {company.godownName}</Text>
        <Text style={styles.companyDetail}>Date: {company.date}</Text>
        <Text style={styles.companyDetail}>Source: {company.source}</Text>
        <Text style={styles.companyDetail}>
          Total Quantity: {totalQuantity}
        </Text>
      </View>
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
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
  companyItem: {
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
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
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
