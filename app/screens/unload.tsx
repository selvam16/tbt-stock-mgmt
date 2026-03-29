import AddPartyFAB from "@/components/AddPartyFAB";
import AppLayout from "@/components/AppLayout";
import PartyCard from "@/components/PartyCard";
import { Party, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function UnloadScreen() {
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

  const renderPartyItem = ({ item }: { item: Party }) => (
    <PartyCard party={item} onDelete={handlePartyDeleted} source="unload" />
  );

  return (
    <View style={styles.container}>
      <AppLayout title="Unload Stock">
        {parties.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No parties added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to add a new party
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
