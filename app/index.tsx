import { formatters } from "@/lib/formatters";
import { Godown, GodownStock, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import * as Print from "expo-print";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppLayout from "../components/AppLayout";
import { DevMenu } from "../components/DevMenu";

interface GodownWithQuantity extends Godown {
  totalQuantity: number;
}

export default function Home() {
  const router = useRouter();
  const [godowns, setGodowns] = useState<GodownWithQuantity[]>([]);
  const [loading, setLoading] = useState(true);
  const [devMenuVisible, setDevMenuVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleDevMenuTap = () => {
    setTapCount((prev) => {
      const newCount = prev + 1;
      if (newCount === 5) {
        setDevMenuVisible(true);
        return 0;
      }
      // Reset after 2 seconds of inactivity
      setTimeout(() => setTapCount(0), 2000);
      return newCount;
    });
  };

  const loadGodownsWithQuantities = useCallback(async () => {
    setLoading(true);
    try {
      const [godownsData, godownStocks] = await Promise.all([
        storage.getGodowns(),
        storage.getGodownStocks(),
      ]);

      // Calculate total quantity for each godown
      const quantityMap = new Map<string, number>();
      godownStocks.forEach((stock: GodownStock) => {
        const current = quantityMap.get(stock.godownName) || 0;
        quantityMap.set(stock.godownName, current + stock.loadedQuantity);
      });

      // Merge godown data with quantities
      const godownsWithQuantity: GodownWithQuantity[] = godownsData.map(
        (godown: Godown) => ({
          ...godown,
          totalQuantity: quantityMap.get(godown.name) || 0,
        }),
      );

      setGodowns(godownsWithQuantity);
    } catch (error) {
      console.error("Error loading godowns:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGodownsWithQuantities();
    }, [loadGodownsWithQuantities]),
  );

  const downloadUnloadStocksPDF = async () => {
    try {
      // Fetch all required data
      const [allStocks, allItems, allCompanies] = await Promise.all([
        storage.getGodownStocks(),
        storage.getItems(),
        storage.getCompanies(),
      ]);

      // Filter stocks by companies with source = "unload"
      const unloadCompanyIds = new Set(
        allCompanies.filter((c) => c.source === "unload").map((c) => c.id),
      );

      const unloadStocks = allStocks.filter((stock) => {
        const item = allItems.find((i) => i.id === stock.itemId);
        return item && unloadCompanyIds.has(item.companyId);
      });

      console.log("Unload stocks found:", unloadStocks.length);
      console.log("Unload company IDs:", Array.from(unloadCompanyIds));

      if (unloadStocks.length === 0) {
        Alert.alert("No Data", "No unload stocks found");
        return;
      }

      // Fetch parties for grouping
      const allParties = await storage.getParties();

      // Group by party
      const groupedByParty = new Map<
        string,
        {
          partyName: string;
          total: number;
        }
      >();

      // Process each unload stock
      unloadStocks.forEach((stock) => {
        const item = allItems.find((i) => i.id === stock.itemId);
        if (!item) {
          console.log("Item not found for stock:", stock.itemId);
          return;
        }

        const company = allCompanies.find((c) => c.id === item.companyId);
        if (!company) {
          console.log("Company not found for item:", item.companyId);
          return;
        }

        const party = allParties.find((p) => p.id === company.partyId);
        if (!party) {
          console.log("Party not found for company:", company.partyId);
          return;
        }

        const partyId = party.id;
        const partyName = `${party.title || ""} - ${party.name || ""}`.trim();

        if (!groupedByParty.has(partyId)) {
          groupedByParty.set(partyId, {
            partyName,
            total: 0,
          });
        }

        const group = groupedByParty.get(partyId)!;
        group.total += stock.loadedQuantity;
      });

      console.log("Grouped by party, total parties:", groupedByParty.size);
      console.log("Grouped parties:", Array.from(groupedByParty.values()));

      // Calculate grand total
      const grandTotal = Array.from(groupedByParty.values()).reduce(
        (sum, group) => sum + group.total,
        0,
      );

      // Generate party summary rows - explicitly iterate through all parties
      let partySummaryHTML = "";
      Array.from(groupedByParty.values()).forEach((group) => {
        partySummaryHTML += `
        <div style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #333; font-size: 13px;">
          <span>${group.partyName}</span>
          <span style="font-weight: bold; color: #007AFF;">${group.total}</span>
        </div>
      `;
      });

      // Create HTML content for PDF
      const htmlContent = `
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
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .subtitle {
                font-size: 12px;
                color: #666;
              }
              .summary-container {
                background-color: white;
                border: 2px solid #333;
                border-radius: 5px;
                overflow: hidden;
                margin-top: 20px;
              }
              .summary-header {
                background-color: #007AFF;
                color: white;
                padding: 12px;
                font-weight: bold;
                font-size: 13px;
                display: flex;
                align-items: center;
                border-bottom: 2px solid #333;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 12px;
                border-bottom: 1px solid #333;
                font-size: 13px;
              }
              .summary-total {
                display: flex;
                justify-content: space-between;
                padding: 12px;
                font-weight: bold;
                font-size: 13px;
                color: red;
                border-top: 2px solid #333;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">UNLOAD STOCKS BY PARTY</div>
              <div class="subtitle">${new Date().toLocaleDateString()}</div>
            </div>

            <div class="summary-container">
              <div class="summary-header">
                <span style="flex: 1;">PARTY NAME</span>
                <span>TOTAL QUANTITY</span>
              </div>
              ${partySummaryHTML}
              <div class="summary-total">
                <span>GRAND TOTAL</span>
                <span>${grandTotal}</span>
              </div>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      await Print.printAsync({
        html: htmlContent,
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to generate PDF",
      );
    }
  };

  return (
    <>
      <AppLayout
        title="Dashboard"
        hideClose
        isHome={true}
        footer={
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.button, styles.loadBtn]}
              onPress={() => router.push("/screens/load")}
            >
              <Text style={styles.buttonText}>LOAD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.unloadBtn]}
              onPress={() => router.push("/screens/unload")}
            >
              <Text style={styles.buttonText}>UNLOAD</Text>
            </TouchableOpacity>
          </View>
        }
      >
        {/* STOCK */}
        <TouchableOpacity
          onPress={handleDevMenuTap}
          style={{ marginBottom: 10 }}
        >
          <Text style={styles.sectionTitle}>Godowns</Text>
        </TouchableOpacity>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => storage.downloadJSON()}
            style={styles.downloadLink}
          >
            <Text style={{ color: colors.primary }}>Download Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={downloadUnloadStocksPDF}
            style={styles.downloadLink}
          >
            <Text style={{ color: colors.primary }}>Download Unload PDF</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text>Loading godowns...</Text>
          </View>
        ) : godowns.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No godowns found.</Text>
          </View>
        ) : (
          <FlatList
            data={godowns}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.columnWrapper}
            scrollEnabled={true}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/screens/godowns/godown-details",
                    params: { godownName: item.name },
                  })
                }
                activeOpacity={0.7}
                style={styles.cardWrapper}
              >
                <View style={styles.card}>
                  <Text style={styles.godownLabel}>
                    {formatters.godownName(item.name)}
                  </Text>
                  <Text style={styles.quantityValue}>{item.totalQuantity}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </AppLayout>

      <DevMenu
        visible={devMenuVisible}
        onClose={() => setDevMenuVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  marginTop: {
    marginTop: 20,
  },
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  godownLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: "600",
    textAlign: "center",
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  empty: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerContainer: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
  },
  loadBtn: {
    backgroundColor: colors.load,
    marginRight: 5,
  },
  unloadBtn: {
    backgroundColor: colors.unload,
  },
  buttonText: {
    textAlign: "center",
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  downloadLink: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
