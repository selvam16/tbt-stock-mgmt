import { formatters } from "@/lib/formatters";
import { Company, GodownStock, Item, Vehicle, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
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
    {
      godownStock: GodownStock;
      company: Company | null;
      item: Item | null;
      totalQuantity: number;
      godowns: string[];
    }[]
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

      // Build detailed list with grouping by company AND item, summing quantities
      const groupedMap = new Map<
        string,
        {
          godownStock: GodownStock;
          company: Company | null;
          item: Item | null;
          totalQuantity: number;
        }
      >();

      vehicleStocks.forEach((stock) => {
        const item = items.find((i) => i.id === stock.itemId) || null;
        const company = item
          ? companies.find((c) => c.id === item.companyId) || null
          : null;

        // Group by company ID + item ID to consolidate same item from same company
        const groupKey = `${item?.companyId || "unknown"}_${stock.itemId}`;

        if (groupedMap.has(groupKey)) {
          const existing = groupedMap.get(groupKey)!;
          // Add quantity if same company and same item
          existing.totalQuantity += Math.abs(stock.loadedQuantity);
        } else {
          groupedMap.set(groupKey, {
            godownStock: stock,
            company,
            item,
            totalQuantity: Math.abs(stock.loadedQuantity),
          });
        }
      });

      // Convert to array and add flag for showing company name
      const details = Array.from(groupedMap.values()).map(
        (item, index, array) => {
          const isFirstOfCompany =
            index === 0 || array[index - 1].company?.id !== item.company?.id;
          return {
            ...item,
            showCompanyName: isFirstOfCompany,
          };
        },
      );
      setLoadedItems(details as any);
      setShowModal(true);
    } catch (error) {
      Alert.alert("Error", "Failed to load details");
      console.error(error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrint = async () => {
    try {
      // Fetch party details
      const parties = await storage.getParties();
      const party = parties.find((p) => p.id === vehicle.partyId);

      // Create HTML content for PDF
      let htmlContent = `
        <html>
          <head>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, sans-serif;
                margin: 15px;
                background-color: #f5f5f5;
              }
              .logo-section {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
              }
              .logo {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background-color: #007AFF;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 32px;
              }
              .details-section {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
              }
              .party-details {
                flex: 1;
                background-color: white;
                padding: 12px;
                border-radius: 5px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .vehicle-details {
                flex: 1;
                background-color: white;
                padding: 12px;
                border-radius: 5px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .detail-item {
                display: flex;
                margin-bottom: 6px;
                font-size: 13px;
              }
              .detail-label {
                font-weight: bold;
                color: #555;
                font-size: 12px;
                margin-right: 8px;
                flex: 0 0 120px;
              }
              .detail-value {
                color: #333;
                font-size: 13px;
              }
              .section-title {
                font-weight: bold;
                color: #007AFF;
                font-size: 14px;
                margin-bottom: 8px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 4px;
              }
              .items-section {
                margin-top: 15px;
              }
              .items-header {
                background-color: #007AFF;
                color: white;
                padding: 8px;
                border-radius: 5px;
                font-weight: bold;
                margin-bottom: 10px;
                font-size: 13px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                background-color: white;
                font-size: 12px;
              }
              th {
                background-color: #f0f0f0;
                padding: 8px;
                text-align: left;
                font-weight: bold;
                border-bottom: 2px solid #ddd;
                font-size: 11px;
              }
              td {
                padding: 8px;
                border-bottom: 1px solid #ddd;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .footer {
                margin-top: 15px;
                text-align: center;
                color: #666;
                font-size: 10px;
              }
              .empty-message {
                background-color: white;
                padding: 15px;
                text-align: center;
                color: #999;
                border-radius: 5px;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <!-- Logo Section - Centered -->
            <div class="logo-section">
              <div class="logo">📋</div>
            </div>
            
            <!-- Details Section: Party Details and Vehicle Details Side by Side -->
            <div class="details-section">
              <div class="party-details">
                ${
                  party
                    ? `
                  <div class="detail-value">${party.title || "N/A"} - ${party.name || "N/A"}</div>
                  <div class="detail-value">${party.contact || "N/A"}</div>
                  <div class="detail-value">${party.city || "N/A"}</div>
                  <div class="detail-value">${party.address || "N/A"}</div>
                `
                    : `
                  <div class="detail-value">No party details available</div>
                `
                }
              </div>
              
              <div class="vehicle-details">
                <div class="detail-item">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${formatters.date(vehicle.date)}</span>
                </div>
                
                <div class="detail-item">
                  <span class="detail-label">Vehicle Number:</span>
                  <span class="detail-value">${vehicle.vehicleNumber}</span>
                </div>
                
                <div class="detail-item">
                  <span class="detail-label">Name Board:</span>
                  <span class="detail-value">${vehicle.nameBoard}</span>
                </div>
                
                <div class="detail-item">
                  <span class="detail-label">Type:</span>
                  <span class="detail-value">${vehicle.vehicleType}</span>
                </div>
                
                <div class="detail-item">
                  <span class="detail-label">Delivery At:</span>
                  <span class="detail-value">${vehicle.deliveryAt}</span>
                </div>
              </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
              <div class="items-header">LOADED ITEMS</div>
              ${
                loadedItems.length === 0
                  ? `<div class="empty-message">No items loaded</div>`
                  : `
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Company</th>
                      <th>Item</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${loadedItems
                      .map(
                        (item, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${(item as any).showCompanyName ? item.company?.companyName || "Unknown" : ""}</td>
                        <td>${item.item?.itemName || "Unknown"}</td>
                        <td>${item.totalQuantity}</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              `
              }
            </div>

            <!-- Total and Footer -->
            <div style="background-color: white; padding: 12px; margin-top: 15px; border-radius: 5px; border: 1px solid #ddd;">
              <div style="font-weight: bold; color: #333;">Total Items: ${loadedItems.length}</div>
            </div>

            <div class="footer">
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      // Generate PDF from HTML using expo-print
      await Print.printAsync({
        html: htmlContent,
      });

      setShowModal(false);
    } catch (error) {
      console.error("Print error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to generate PDF",
      );
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
          <Text style={styles.vehicleNumber}>
            🚚 {formatters.vehicleNumber(vehicle.vehicleNumber)}
          </Text>
          <Text style={styles.vehicleDetail}>
            📋 {formatters.vehicleNameBoard(vehicle.nameBoard)}
          </Text>
          <Text style={styles.vehicleDetail}>
            📦 {formatters.label("TYPE")}:{" "}
            {formatters.vehicleType(vehicle.vehicleType)}
          </Text>
          <Text style={styles.vehicleDetail}>
            📍 {formatters.deliveryLocation(vehicle.deliveryAt)}
          </Text>
          <Text style={styles.vehicleDetail}>
            📅 {formatters.date(vehicle.date)}
          </Text>
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
                {formatters.label("LOADED ITEMS")} -{" "}
                {formatters.vehicleNumber(vehicle.vehicleNumber)}
              </Text>
              <TouchableOpacity onPress={handlePrint}>
                <MaterialIcons name="print" size={24} color={colors.primary} />
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
                    {formatters.label("COMPANY")}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableHeaderCell,
                      styles.itemColumn,
                    ]}
                  >
                    {formatters.label("ITEM")}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableHeaderCell,
                      styles.quantityColumn,
                    ]}
                  >
                    {formatters.label("QTY")}
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
                        {(item as any).showCompanyName
                          ? formatters.companyName(
                              item.company?.companyName || "Unknown",
                            )
                          : ""}
                      </Text>
                      <Text style={[styles.tableCell, styles.itemColumn]}>
                        {formatters.itemName(item.item?.itemName || "Unknown")}
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
