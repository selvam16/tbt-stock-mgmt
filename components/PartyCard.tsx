import { Party, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PartyCardProps {
  party: Party;
  onDelete: () => void;
  source?: "add" | "unload";
}

export default function PartyCard({
  party,
  onDelete,
  source = "add",
}: PartyCardProps) {
  const router = useRouter();

  const handleDelete = () => {
    Alert.alert(
      "Delete Party",
      `Are you sure you want to delete ${party.name}?`,
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
              await storage.deleteParty(party.id);
              onDelete();
              Alert.alert("Success", "Party deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete party");
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
      pathname: "/screens/parties/add-party",
      params: { partyId: party.id },
    });
  };

  const handleCardPress = () => {
    router.push({
      pathname: "/screens/companies/company-lists",
      params: { partyId: party.id, source },
    });
  };

  return (
    <TouchableOpacity style={styles.partyCard} onPress={handleCardPress}>
      <View style={styles.partyInfo}>
        <Text style={styles.partyName}>
          {party.title} {party.name}
        </Text>
        <Text style={styles.partyDetail}>📞 {party.contact}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <MaterialIcons name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <MaterialIcons name="delete" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  partyCard: {
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
  partyInfo: {
    flex: 1,
    gap: 6,
  },
  partyName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  partyDetail: {
    fontSize: 13,
    color: colors.textSecondary,
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
