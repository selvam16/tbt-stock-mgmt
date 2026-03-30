import AddPartyFAB from "@/components/AddPartyFAB";
import AppLayout from "@/components/AppLayout";
import { Party, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoadScreen() {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadParties();
    }, []),
  );

  const loadParties = async () => {
    try {
      const data = await storage.getParties();
      setParties(data);
    } catch (error) {
      console.error("Error loading parties:", error);
    }
  };

  const handlePartyDeleted = () => {
    loadParties();
  };

  const handlePartySelect = (party: Party) => {
    router.push({
      pathname: "/screens/vehicles/vehicles-list",
      params: { partyId: party.id },
    });
  };

  const handleEdit = (party: Party) => {
    router.push({
      pathname: "/screens/parties/add-party",
      params: { partyId: party.id },
    });
  };

  const handleDelete = (party: Party) => {
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
              handlePartyDeleted();
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

  const renderPartyItem = ({ item }: { item: Party }) => (
    <TouchableOpacity
      style={styles.partyCard}
      onPress={() => handlePartySelect(item)}
    >
      <View style={styles.partyInfo}>
        <Text style={styles.partyName}>
          {item.title} {item.name}
        </Text>
        <Text style={styles.partyDetail}>📞 {item.contact}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <MaterialIcons name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <MaterialIcons name="delete" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppLayout title="Load Stock">
        {parties.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No parties added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add a party first to load stock
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Select Party</Text>
            <FlatList
              data={parties}
              keyExtractor={(item) => item.id}
              renderItem={renderPartyItem}
              scrollEnabled={false}
            />
          </>
        )}
      </AppLayout>
      <AddPartyFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: colors.textPrimary,
  },
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
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
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
});
