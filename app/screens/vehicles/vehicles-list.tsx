import AddVehicleFAB from "@/components/AddVehicleFAB";
import AppLayout from "@/components/AppLayout";
import VehicleCard from "@/components/VehicleCard";
import { Party, Vehicle, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function VehiclesListScreen() {
  const params = useLocalSearchParams();
  const partyId =
    typeof params.partyId === "string" ? params.partyId : params.partyId?.[0];
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicleQuantities, setVehicleQuantities] = useState<
    Record<string, number>
  >({});

  const loadData = useCallback(async () => {
    try {
      if (!partyId || typeof partyId !== "string") return;

      const parties = await storage.getParties();
      const p = parties.find((p) => p.id === partyId);
      setParty(p || null);

      const vehcls = await storage.getVehicles(partyId);
      setVehicles(vehcls);

      // Calculate loaded quantities for each vehicle
      const allGodownStocks = await storage.getGodownStocks();
      const quantityMap: Record<string, number> = {};

      vehcls.forEach((vehicle) => {
        // Sum all quantities loaded (negative values) for this vehicle
        const loadedQuantity = allGodownStocks
          .filter(
            (stock) =>
              stock.vehicleNumber === vehicle.vehicleNumber &&
              stock.loadedQuantity < 0,
          )
          .reduce((sum, stock) => sum + Math.abs(stock.loadedQuantity), 0);
        quantityMap[vehicle.id] = loadedQuantity;
      });

      setVehicleQuantities(quantityMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [partyId]);

  useEffect(() => {
    if (partyId && typeof partyId === "string") {
      loadData();
    }
  }, [partyId, loadData]);

  useFocusEffect(
    useCallback(() => {
      if (partyId && typeof partyId === "string") {
        loadData();
      }
    }, [partyId, loadData]),
  );

  const handleVehicleDeleted = () => {
    loadData();
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <VehicleCard
      vehicle={item}
      onDelete={handleVehicleDeleted}
      source="add"
      loadedQuantity={vehicleQuantities[item.id] || 0}
    />
  );

  if (loading) {
    return (
      <AppLayout title="Loading Vehicles">
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <View style={styles.container}>
      <AppLayout title={party ? `${party.name}'s Vehicles` : "Vehicles"}>
        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No vehicles added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to add a new vehicle
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Vehicles for Loading</Text>
            <FlatList
              data={vehicles}
              keyExtractor={(item) => item.id}
              renderItem={renderVehicleItem}
              scrollEnabled={false}
            />
          </>
        )}
      </AppLayout>
      <AddVehicleFAB partyId={partyId as string} />
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
