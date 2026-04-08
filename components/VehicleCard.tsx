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

      // Group items by company
      const groupedByCompany = new Map<
        string,
        {
          company: Company | null;
          items: typeof loadedItems;
          total: number;
        }
      >();

      loadedItems.forEach((item) => {
        const companyId = item.company?.id || "unknown";
        if (!groupedByCompany.has(companyId)) {
          groupedByCompany.set(companyId, {
            company: item.company,
            items: [],
            total: 0,
          });
        }
        const group = groupedByCompany.get(companyId)!;
        group.items.push(item);
        group.total += item.totalQuantity;
      });

      let companies = Array.from(groupedByCompany.values());

      // Calculate total quantity
      const totalQuantity = loadedItems.reduce(
        (sum, item) => sum + item.totalQuantity,
        0,
      );

      // Sort companies by number of items (descending) for better alignment
      companies.sort((a, b) => b.items.length - a.items.length);

      // Create company summary for first page
      const companySummaryHTML = companies
        .map(
          (company) => `
        <div class="company-summary-row">
          <span>${company.company?.companyName || "Unknown"}</span>
          <span>${company.total}</span>
        </div>
      `,
        )
        .join("");

      // Create pairs of companies for 2-column layout
      const companyPairs = [];
      for (let i = 0; i < companies.length; i += 2) {
        companyPairs.push({
          left: companies[i],
          right: companies[i + 1] || null,
        });
      }

      // Generate HTML for 2-column company layout with proper alignment
      const companiesHTML = companyPairs
        .map((pair) => {
          return `
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <!-- Left Company -->
            <div style="flex: 1; background-color: white; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
              ${
                pair.left
                  ? `
                <div style="background-color: #f8ff00; color: black; padding: 10px; font-weight: bold;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>${pair.left.company?.companyName || "Unknown"}</div>
                    <div style="font-size: 12px;">${pair.left.total}</div>
                  </div>
                  <div style="font-size: 11px; margin-top: 6px; opacity: 0.8; text-align: center;">${pair.left.company?.agentName || ""}</div>
                </div>
                ${pair.left.items
                  .map(
                    (item) => `
                  <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px;">
                    <span>${item.item?.itemName || "Unknown"}</span>
                    <span style="font-weight: bold; color: #007AFF;">${item.totalQuantity}</span>
                  </div>
                `,
                  )
                  .join("")}
              `
                  : ""
              }
            </div>

            <!-- Right Company -->
            <div style="flex: 1; background-color: white; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
              ${
                pair.right
                  ? `
                <div style="background-color: #f8ff00; color: black; padding: 10px; font-weight: bold;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>${pair.right.company?.companyName || "Unknown"}</div>
                    <div style="font-size: 12px;">${pair.right.total}</div>
                  </div>
                  <div style="font-size: 11px; margin-top: 6px; opacity: 0.8; text-align: center;">${pair.right.company?.agentName || ""}</div>
                </div>
                ${pair.right.items
                  .map(
                    (item) => `
                  <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px;">
                    <span>${item.item?.itemName || "Unknown"}</span>
                    <span style="font-weight: bold; color: #007AFF;">${item.totalQuantity}</span>
                  </div>
                `,
                  )
                  .join("")}
              `
                  : ""
              }
            </div>
          </div>
        `;
        })
        .join("");

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
                text-transform: uppercase;
              }
              .page-break {
                page-break-after: always;
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
              .detail-value-red{
                color: #ef4444;
                font-size: 13px;
                font-weight: bold;
              }
              .detail-value {
                color: #333;
                font-size: 13px;
              }
              .company-divider {
                width: 1px;
                background-color: #333;
                margin: 0 12px;
                align-self: stretch;
              }
              .company-summary {
                margin-top: 20px;
                background-color: white;
                border: 2px solid #333;
                border-radius: 5px;
                overflow: hidden;
              }
              .company-summary-header {
                color: white;
                padding: 12px;
                font-weight: bold;
                font-size: 13px;
                display: flex;
                align-items: center;
                border-bottom: 2px solid #333;
              }
              .company-summary-row {
                display: flex;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #333;
                font-size: 13px;
              }
              .company-summary-row span:first-child {
                flex: 1;
              }
              .company-summary-row span:last-child {
                text-align: right;
                min-width: 60px;
                font-weight: bold;
                color: #007AFF;
              }
              .company-summary-total {
                display: flex;
                align-items: center;
                padding: 12px;
                font-weight: bold;
                font-size: 13px;
                color: red;
              }
              .company-summary-total span:first-child {
                flex: 1;
                text-align: right;
              }
              .company-summary-total span:last-child {
                text-align: right;
                min-width: 60px;
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
            <!-- PAGE 1 -->
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
                  <div class="detail-value">TO</div>
                  <div class="detail-value-red">${party.title || "N/A"} - ${party.name || "N/A"}</div>
                  <div class="detail-value-red">${party.address || "N/A"}</div>
                  <div class="detail-value-red">${party.city || "N/A"}</div>
                  <div class="detail-value-red">${party.contact || "N/A"}</div>
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

            <div class="items-section" style="border: 1px 0px solid  black; ">
              <div style="margin-left: 15px; margin-bottom: 10px;">SIR,</div>
              <div style="text-align: center;">PLEASE RECEIVE <span style="font-weight: bold; color: red;">${totalQuantity} NOS </span>ONLY</div>
            </div>

            <!-- Company Summary Section -->
            <div class="company-summary">
              <div class="company-summary-header">
                <span style="font-weight: bold; color: red;">LOADING DETAILS</span>
              </div>
              ${companySummaryHTML}
              <div class="company-summary-total">
                <span>TOTAL</span>
                <span>${totalQuantity}</span>
              </div>
            </div>

            <!-- PAGE BREAK -->
            <div class="page-break"></div>

            <!-- PAGE 2 -->
            <!-- Details Section: Party Details and Vehicle Details Side by Side -->
            <div class="details-section" style="margin-top: 40px;">
              <div class="party-details">
                ${
                  party
                    ? `
                  <div class="detail-value-red">${party.title || "N/A"} - ${party.name || "N/A"}</div>
                  <div class="detail-value-red">${party.address || "N/A"}</div>
                  <div class="detail-value-red">${party.city || "N/A"}</div>
                `
                    : `
                  <div class="detail-value">No party details available</div>
                `
                }
              </div>
              
              <div class="vehicle-details">
                <div class="detail-item">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">: ${formatters.date(vehicle.date)}</span>
                </div>
                
                <div class="detail-item">
                  <span class="detail-label">Vehicle Number</span>
                  <span class="detail-value">: ${vehicle.vehicleNumber}</span>
                </div>
                                
                <div class="detail-item" style="color: red !important;">
                  <span class="detail-label" style="color: red !important;">Total</span>
                  <span class="detail-value" style="color: red !important;">: ${totalQuantity}</span>
                </div>
              </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
              ${
                loadedItems.length === 0
                  ? `<div class="empty-message">No items loaded</div>`
                  : companiesHTML
              }
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
