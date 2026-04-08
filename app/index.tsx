import { formatters } from "@/lib/formatters";
import { Godown, GodownStock, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import * as Print from "expo-print";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [parties, setParties] = useState<any[]>([]);
  const [partyNames, setPartyNames] = useState<string[]>([]);
  const [partySearchText, setPartySearchText] = useState("");
  const [partySuggestions, setPartySuggestions] = useState<any[]>([]);
  const [showPartySuggestions, setShowPartySuggestions] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const loadPartyNames = useCallback(async () => {
    try {
      const allParties = await storage.getParties();
      setParties(allParties);
      const names = allParties.map((p) => `${p.title} - ${p.name}`);
      setPartyNames(names);
    } catch (error) {
      console.error("Error loading parties:", error);
    }
  }, []);

  const handlePartySearch = (text: string) => {
    const updated = text.trimStart();
    setPartySearchText(updated);

    if (updated.length === 0) {
      setPartySuggestions([]);
      setShowPartySuggestions(false);
      return;
    }

    const matches = parties.filter(
      (party) =>
        `${party.title} - ${party.name}`
          .toLowerCase()
          .includes(updated.toLowerCase()) &&
        `${party.title} - ${party.name}`.toLowerCase() !==
          updated.toLowerCase(),
    );
    setPartySuggestions(matches);
    setShowPartySuggestions(matches.length > 0);
  };

  const handleSelectPartyForPDF = useCallback(async (party: any) => {
    setPartySuggestions([]);
    setShowPartySuggestions(false);
    setIsGeneratingPDF(true);

    try {
      await downloadUnloadStocksPDF(party.id);
      // Close modal after PDF generation
      setShowPDFModal(false);
      setPartySearchText("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, []);

  const openPDFModal = useCallback(async () => {
    try {
      const allParties = await storage.getParties();
      setParties(allParties);
      setShowPDFModal(true);
    } catch (error) {
      Alert.alert("Error", "Failed to load parties");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGodownsWithQuantities();
      loadPartyNames();
    }, [loadGodownsWithQuantities, loadPartyNames]),
  );

  const downloadUnloadStocksPDF = async (selectedPartyId: string) => {
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

      console.log("All companies:", allCompanies.length);
      console.log("Unload companies count:", unloadCompanyIds.size);
      console.log(
        "Unload companies source debug:",
        allCompanies.map((c) => ({
          id: c.id,
          partyId: c.partyId,
          companyName: c.companyName,
          source: c.source,
        })),
      );

      if (unloadCompanyIds.size === 0) {
        Alert.alert("No Data", "No unload companies found");
        return;
      }

      // Fetch parties for grouping
      const allParties = await storage.getParties();

      // Group by party, then by company, then by item
      const groupedByParty = new Map<
        string,
        {
          partyName: string;
          partyTotal: number;
          companies: Map<
            string,
            {
              companyName: string;
              unloadedDate: string;
              godownName: string;
              items: Array<{
                itemName: string;
                quantity: number;
              }>;
            }
          >;
        }
      >();

      // First, initialize all parties with their unload companies
      allParties
        .filter((party) => party.id === selectedPartyId)
        .forEach((party) => {
          const partyCompanies = allCompanies.filter(
            (c) => c.partyId === party.id && unloadCompanyIds.has(c.id),
          );

          console.log(
            `Party: ${party.name}, Unload companies: ${partyCompanies.length}`,
            partyCompanies.map((c) => c.companyName),
          );

          if (partyCompanies.length > 0) {
            const partyName =
              `${party.title || ""} - ${party.name || ""}`.trim();

            if (!groupedByParty.has(party.id)) {
              groupedByParty.set(party.id, {
                partyName,
                partyTotal: 0,
                companies: new Map(),
              });
            }

            const partyGroup = groupedByParty.get(party.id)!;

            // Add all unload companies for this party
            partyCompanies.forEach((company) => {
              if (!partyGroup.companies.has(company.id)) {
                partyGroup.companies.set(company.id, {
                  companyName: company.companyName,
                  godownName: company.godownName || "",
                  unloadedDate: company.date || "",
                  items: [],
                });
              }
            });
          }
        });

      // Then process stocks and add items to companies
      const unloadStocks = allStocks.filter((stock) => {
        const item = allItems.find((i) => i.id === stock.itemId);
        return item && unloadCompanyIds.has(item.companyId);
      });

      // Process each unload stock and add items to respective companies
      unloadStocks.forEach((stock) => {
        const item = allItems.find((i) => i.id === stock.itemId);
        if (!item) return;

        const company = allCompanies.find((c) => c.id === item.companyId);
        if (!company) return;

        const party = allParties.find((p) => p.id === company.partyId);
        if (!party) return;

        const partyId = party.id;
        const partyGroup = groupedByParty.get(partyId);
        if (!partyGroup) return;

        // Update party total
        partyGroup.partyTotal += stock.loadedQuantity;

        // Add or update item in company
        const companyGroup = partyGroup.companies.get(company.id);
        if (!companyGroup) return;

        const existingItem = companyGroup.items.find(
          (i) => i.itemName === item.itemName,
        );
        if (existingItem) {
          existingItem.quantity += stock.loadedQuantity;
        } else {
          companyGroup.items.push({
            itemName: item.itemName,
            quantity: stock.loadedQuantity,
          });
        }
      });

      // Calculate grand total
      const grandTotal = Array.from(groupedByParty.values()).reduce(
        (sum, party) => sum + party.partyTotal,
        0,
      );

      // Generate detailed HTML with parties, companies, and items
      let detailedHTML = "";
      Array.from(groupedByParty.values()).forEach((partyGroup) => {
        console.log(
          `Generating PDF for party: ${partyGroup.partyName}, companies count: ${partyGroup.companies.size}`,
        );
        console.log(
          "Companies in party:",
          Array.from(partyGroup.companies.values()).map((c) => c.companyName),
        );
        // Party header
        detailedHTML += `
        <div style="display: flex; justify-content: space-between; padding: 12px; background-color: #007AFF; color: white; font-weight: bold; font-size: 14px; margin-top: 15px; border-radius: 3px;">
          <span>${partyGroup.partyName}</span>
          <span>${partyGroup.partyTotal}</span>
        </div>
      `;

        // Companies in 2-column layout
        const companies = Array.from(partyGroup.companies.values());
        detailedHTML += `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; width: 100%;">
      `;

        companies.forEach((companyGroup) => {
          // Calculate total quantity for this company
          const companyTotal = companyGroup.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );

          detailedHTML += `
          <div style="border: 1px solid #ddd; border-radius: 3px; overflow: hidden; min-width: 0;">
            <div style="background-color: #FFD700; padding: 10px; font-weight: bold; font-size: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">
              <div>
              <span style="flex: 0 0 auto;">${companyGroup.companyName}</span>
              <span style="color: #007AFF; flex: 0 0 auto;">- ${companyTotal}</span>
              </div>
              <span style="font-size: 10px; font-weight: normal; color: #333;">(${companyGroup.godownName})</span>
              <span style="font-size: 10px; font-weight: normal; color: #333;">(${companyGroup.unloadedDate})</span>
            </div>
            <div style="padding: 10px;">
        `;

          // Items under this company
          companyGroup.items.forEach((item) => {
            detailedHTML += `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 11px;">
                <span style="flex: 1;">${item.itemName}</span>
                <span style="font-weight: bold; color: #007AFF; min-width: 50px; text-align: right;">${item.quantity}</span>
              </div>
            `;
          });

          detailedHTML += `
            </div>
          </div>
        `;
        });

        detailedHTML += `
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
              .content-container {
                background-color: white;
                padding: 15px;
                border-radius: 5px;
              }
              .total-stock-count {
                text-align: center;
                padding: 15px;
                font-size: 16px;
                font-weight: bold;
                color: red;
                margin-bottom: 15px;
                background-color: white;
                border: 2px solid red;
                border-radius: 5px;
              }
              .grand-total {
                display: flex;
                justify-content: space-between;
                padding: 12px;
                font-weight: bold;
                font-size: 13px;
                color: white;
                background-color: #333;
                border-radius: 3px;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">UNLOAD STOCKS BY PARTY</div>
              <div class="subtitle">${new Date().toLocaleDateString()}</div>
            </div>

            <div class="total-stock-count">
              TOTAL STOCK COUNT: <span style="color: red;">${grandTotal}</span>
            </div>

            <div class="content-container">
              ${detailedHTML}
              <div class="grand-total">
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

          <TouchableOpacity onPress={openPDFModal} style={styles.downloadLink}>
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

      {/* PDF Download Modal */}
      <Modal
        visible={showPDFModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPDFModal(false);
          setPartySearchText("");
          setPartySuggestions([]);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Download Unload PDF</Text>
              <Pressable
                onPress={() => {
                  setShowPDFModal(false);
                  setPartySearchText("");
                  setPartySuggestions([]);
                }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.formLabel}>Select a Party:</Text>
              <View style={styles.partySearchContainer}>
                <TextInput
                  style={styles.partySearchInput}
                  placeholder="Search party name..."
                  placeholderTextColor="#999"
                  value={partySearchText}
                  onChangeText={handlePartySearch}
                  editable={!isGeneratingPDF}
                />
                {showPartySuggestions && partySuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {partySuggestions.map((party) => (
                      <TouchableOpacity
                        key={party.id}
                        style={styles.suggestionOption}
                        onPress={() => handleSelectPartyForPDF(party)}
                        disabled={isGeneratingPDF}
                      >
                        <View>
                          <Text style={styles.suggestionOptionText}>
                            {party.title} - {party.name}
                          </Text>
                          {party.city && (
                            <Text style={styles.suggestionCity}>
                              {party.city}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {isGeneratingPDF && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Generating PDF...</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  modalBody: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    color: colors.textPrimary,
  },
  partySearchContainer: {
    marginBottom: 12,
  },
  partySearchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: "#f9f9f9",
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    backgroundColor: colors.card,
    maxHeight: 200,
  },
  suggestionOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  suggestionCity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
