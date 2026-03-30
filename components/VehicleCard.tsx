import { Company, GodownStock, Item, Vehicle, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface VehicleCardProps {
  vehicle: Vehicle;
  onDelete: () => void;
  source?: "add" | "unload";
  loadedQuantity?: number;
}

export default function VehicleCard({
  vehicle,
  onDelete,
  source = "add",
  loadedQuantity = 0,
}: VehicleCardProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loadedItems, setLoadedItems] = useState<
    Array<{
      godownStock: GodownStock;
      company: Company | null;
      item: Item | null;
      totalQuantity: number;
      godowns: string[];
    }>
  >([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Delete Vehicle",
      `Are you sure you want to delete ${vehicle.vehicleNumber}?`,
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
              await storage.deleteVehicle(vehicle.id);
              onDelete();
              Alert.alert("Success", "Vehicle deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete vehicle");
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
      pathname: "/screens/vehicles/add-vehicle",
      params: { vehicleId: vehicle.id },
    });
  };

  const handleCardPress = () => {
    router.push({
      pathname: "/screens/companies/company-lists",
      params: { partyId: vehicle.partyId, vehicleId: vehicle.id, source },
    });
  };

  const handleViewDetails = async () => {
    setLoadingDetails(true);
    try {
      // Get all godown stocks for this vehicle
      const allGodownStocks = await storage.getGodownStocks();
      const vehicleStocks = allGodownStocks.filter(
        (stock) => stock.vehicleNumber === vehicle.vehicleNumber,
      );

      // Get all companies and items
      const companies = await storage.getCompanies();
      const items = await storage.getItems();

      // Build detailed list with grouping by company and item
      const groupedMap = new Map<
        string,
        {
          godownStock: GodownStock;
          company: Company | null;
          item: Item | null;
          totalQuantity: number;
          godowns: string[];
        }
      >();

      vehicleStocks.forEach((stock) => {
        const item = items.find((i) => i.id === stock.itemId) || null;
        const company = item
          ? companies.find((c) => c.id === item.companyId) || null
          : null;

        // Create a unique key for grouping: company_id + item_id
        const groupKey = `${item?.companyId || "unknown"}_${stock.itemId}`;

        if (groupedMap.has(groupKey)) {
          const existing = groupedMap.get(groupKey)!;
          existing.totalQuantity += Math.abs(stock.loadedQuantity);
          if (!existing.godowns.includes(stock.godownName)) {
            existing.godowns.push(stock.godownName);
          }
        } else {
          groupedMap.set(groupKey, {
            godownStock: stock,
            company,
            item,
            totalQuantity: Math.abs(stock.loadedQuantity),
            godowns: [stock.godownName],
          });
        }
      });

      const details = Array.from(groupedMap.values());
      setLoadedItems(details as any);
      setShowModal(true);
    } catch (error) {
      Alert.alert("Error", "Failed to load details");
      console.error(error);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.vehicleCard}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleNumber}>🚚 {vehicle.vehicleNumber}</Text>
          <Text style={styles.vehicleDetail}>📋 {vehicle.nameBoard}</Text>
          <Text style={styles.vehicleDetail}>
            📦 Type: {vehicle.vehicleType}
          </Text>
          <Text style={styles.vehicleDetail}>📍 {vehicle.deliveryAt}</Text>
          <Text style={styles.vehicleDetail}>📅 {vehicle.date}</Text>
          {loadedQuantity > 0 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>
                ✓ Loaded: {loadedQuantity} units
              </Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {loadedQuantity > 0 && source === "add" && (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={handleViewDetails}
              disabled={loadingDetails}
            >
              <MaterialIcons
                name="visibility"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
          {source !== "add" && (
            <>
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <MaterialIcons name="edit" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <MaterialIcons name="delete" size={20} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Details Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Loaded Items - {vehicle.vehicleNumber}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {loadedItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No items loaded</Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                <View style={styles.tableHeaderRow}>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableHeaderCell,
                      styles.companyColumn,
                    ]}
                  >
                    Company
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableHeaderCell,
                      styles.itemColumn,
                    ]}
                  >
                    Item
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableHeaderCell,
                      styles.godownColumn,
                    ]}
                  >
                    Godown
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableHeaderCell,
                      styles.quantityColumn,
                    ]}
                  >
                    Qty
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableHeaderCell,
                      styles.dateColumn,
                    ]}
                  >
                    Date
                  </Text>
                </View>

                <FlatList
                  data={loadedItems}
                  keyExtractor={(item) =>
                    `${item.item?.companyId || "unknown"}_${item.item?.id || "unknown"}`
                  }
                  renderItem={({ item, index }) => (
                    <View
                      style={[
                        styles.tableRow,
                        index % 2 === 0 && styles.tableRowEven,
                      ]}
                    >
                      <Text style={[styles.tableCell, styles.companyColumn]}>
                        {item.company?.companyName || "Unknown"}
                      </Text>
                      <Text style={[styles.tableCell, styles.itemColumn]}>
                        {item.item?.itemName || "Unknown"}
                      </Text>
                      <Text style={[styles.tableCell, styles.godownColumn]}>
                        {item.godowns.join(", ")}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.quantityColumn,
                          styles.quantityValue,
                        ]}
                      >
                        {item.totalQuantity}
                      </Text>
                      <Text style={[styles.tableCell, styles.dateColumn]}>
                        {item.godownStock.date}
                      </Text>
                    </View>
                  )}
                  scrollEnabled={false}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  vehicleCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "column",
    gap: 10,
  },
  vehicleInfo: {
    flex: 1,
    gap: 6,
  },
  vehicleNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  vehicleDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  quantityBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#166534",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  viewButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tableContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  tableRowEven: {
    backgroundColor: colors.card,
  },
  tableCell: {
    paddingHorizontal: 8,
    fontSize: 13,
    color: colors.textPrimary,
  },
  tableHeaderCell: {
    fontWeight: "700",
    color: "#fff",
    paddingVertical: 12,
  },
  companyColumn: {
    flex: 2,
  },
  itemColumn: {
    flex: 2,
  },
  godownColumn: {
    flex: 1.5,
  },
  quantityColumn: {
    flex: 1,
    textAlign: "center",
  },
  dateColumn: {
    flex: 1.2,
  },
  quantityValue: {
    fontWeight: "700",
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeButton: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
