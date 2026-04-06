import { formatters } from "@/lib/formatters";
import { exportTransactionsToPDF } from "@/lib/pdfExporter";
import { Company, GodownStock, Item, Party } from "@/lib/storage";
import { colors } from "@/theme/color";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TransactionCard from "./TransactionCard";

interface TransactionDetail {
  stock: GodownStock;
  item: Item | null;
  company: Company | null;
  party: Party | null;
  type: "load" | "unload";
}

interface TransactionsListProps {
  transactions: TransactionDetail[];
  loading: boolean;
  godownName?: string;
  onDeleteTransaction?: (stockId: string) => void;
  onEditTransaction?: (stockId: string, newQuantity: number) => void;
  companies?: Company[];
  parties?: Party[];
}

export default function TransactionsList({
  transactions,
  loading,
  godownName = "Godown",
  onDeleteTransaction,
  onEditTransaction,
  companies = [],
  parties = [],
}: TransactionsListProps) {
  const [activeTab, setActiveTab] = useState<"load" | "unload" | "all">("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Apply filtering
  let filteredTransactions = transactions;

  // Filter by tab (load/unload/all)
  if (activeTab !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (txn) => txn.type === activeTab,
    );
  }

  // Filter by date range
  if (filterFromDate) {
    filteredTransactions = filteredTransactions.filter((txn) => {
      const txnDate = new Date(txn.stock.date);
      return txnDate >= filterFromDate;
    });
  }

  if (filterToDate) {
    filteredTransactions = filteredTransactions.filter((txn) => {
      const txnDate = new Date(txn.stock.date);
      const endOfDay = new Date(filterToDate);
      endOfDay.setHours(23, 59, 59, 999);
      return txnDate <= endOfDay;
    });
  }

  // Filter by company
  if (selectedCompanyId) {
    filteredTransactions = filteredTransactions.filter(
      (txn) => txn.company?.id === selectedCompanyId,
    );
  }

  // Filter by party
  if (selectedPartyId) {
    filteredTransactions = filteredTransactions.filter(
      (txn) => txn.party?.id === selectedPartyId,
    );
  }

  const handleFromDateChange = (event: any, date?: Date) => {
    if (date) {
      setFilterFromDate(date);
    }
    setShowFromDatePicker(false);
  };

  const handleToDateChange = (event: any, date?: Date) => {
    if (date) {
      setFilterToDate(date);
    }
    setShowToDatePicker(false);
  };

  const clearFilters = () => {
    setFilterFromDate(null);
    setFilterToDate(null);
    setSelectedCompanyId(null);
    setSelectedPartyId(null);
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportTransactionsToPDF({
        godownName,
        transactions: filteredTransactions,
        filterFromDate,
        filterToDate,
        selectedPartyId,
        selectedCompanyId,
        parties,
        companies,
      });
      Alert.alert("Success", "PDF exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to export PDF",
      );
    } finally {
      setIsExporting(false);
      setShowFilterModal(false);
    }
  };

  const hasActiveFilters =
    filterFromDate !== null ||
    filterToDate !== null ||
    selectedCompanyId !== null ||
    selectedPartyId !== null;

  if (transactions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No transactions for this godown</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>
        {formatters.label("TRANSACTIONS")}
      </Text>

      {/* Tabs and Filter Button */}
      <View style={styles.tabAndFilterContainer}>
        <View style={styles.tabContainer}>
          {["load", "unload", "all"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab as "load" | "unload" | "all")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {formatters.label(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            hasActiveFilters && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              hasActiveFilters && styles.filterButtonTextActive,
            ]}
          >
            ⚙️
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          {filterFromDate && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>
                From: {filterFromDate.toLocaleDateString()}
              </Text>
              <TouchableOpacity
                onPress={() => setFilterFromDate(null)}
                style={styles.filterTagClose}
              >
                <Text style={styles.filterTagCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {filterToDate && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>
                To: {filterToDate.toLocaleDateString()}
              </Text>
              <TouchableOpacity
                onPress={() => setFilterToDate(null)}
                style={styles.filterTagClose}
              >
                <Text style={styles.filterTagCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedCompanyId && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>
                {companies.find((c) => c.id === selectedCompanyId)
                  ?.companyName || "Company"}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedCompanyId(null)}
                style={styles.filterTagClose}
              >
                <Text style={styles.filterTagCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedPartyId && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>
                {parties.find((p) => p.id === selectedPartyId)?.name || "Party"}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedPartyId(null)}
                style={styles.filterTagClose}
              >
                <Text style={styles.filterTagCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Filtered Transactions */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab === "all" ? "" : ` ${activeTab}`}
            {hasActiveFilters ? " matching" : ""} transactions
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <TransactionCard
              stock={item.stock}
              item={item.item}
              company={item.company}
              party={item.party}
              type={item.type}
              onDelete={onDeleteTransaction}
              onEdit={onEditTransaction}
            />
          )}
          scrollEnabled={true}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Date Range Section */}
              <Text style={styles.filterSectionTitle}>
                Date Range
                {selectedPartyId &&
                  ` - ${parties.find((p) => p.id === selectedPartyId)?.name || ""}`}
              </Text>
              <TouchableOpacity
                style={styles.filterInput}
                onPress={() => setShowFromDatePicker(true)}
              >
                <Text style={styles.filterInputText}>
                  {filterFromDate
                    ? `From: ${filterFromDate.toLocaleDateString()}`
                    : "Select From Date"}
                </Text>
              </TouchableOpacity>

              {showFromDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={filterFromDate || new Date()}
                    mode="date"
                    display="calendar"
                    onChange={handleFromDateChange}
                    maximumDate={new Date()}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.filterInput}
                onPress={() => setShowToDatePicker(true)}
              >
                <Text style={styles.filterInputText}>
                  {filterToDate
                    ? `To: ${filterToDate.toLocaleDateString()}`
                    : "Select To Date"}
                </Text>
              </TouchableOpacity>

              {showToDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={filterToDate || new Date()}
                    mode="date"
                    display="calendar"
                    onChange={handleToDateChange}
                    maximumDate={new Date()}
                  />
                </View>
              )}

              {/* Party Filter Section */}
              <Text style={styles.filterSectionTitle}>Party</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedPartyId || "all"}
                  onValueChange={(value) => {
                    setSelectedPartyId(value === "all" ? null : value);
                    setSelectedCompanyId(null); // Reset company filter when party changes
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="All Parties" value="all" />
                  {parties.map((party) => (
                    <Picker.Item
                      key={party.id}
                      label={party.name}
                      value={party.id}
                    />
                  ))}
                </Picker>
              </View>

              {/* Company Filter Section - Only show if party is selected */}
              {selectedPartyId && (
                <>
                  <Text style={styles.filterSectionTitle}>Company</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedCompanyId || "all"}
                      onValueChange={(value) =>
                        setSelectedCompanyId(value === "all" ? null : value)
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="All Companies" value="all" />
                      {companies
                        .filter((c) => c.partyId === selectedPartyId)
                        .map((company) => (
                          <Picker.Item
                            key={company.id}
                            label={company.companyName}
                            value={company.id}
                          />
                        ))}
                    </Picker>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.exportButton,
                  isExporting && styles.exportButtonDisabled,
                ]}
                onPress={handleExportPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.exportButtonText}>📥 Export PDF</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  tabAndFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingRight: 8,
  },
  tabContainer: {
    flex: 1,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  filterButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: "white",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterTagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  filterTagClose: {
    padding: 2,
  },
  filterTagCloseText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalCloseButton: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    justifyContent: "center",
  },
  filterInputText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  companyFilterButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  companyFilterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "20",
  },
  companyFilterButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  companyFilterButtonTextActive: {
    color: colors.primary,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  exportButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16a34a",
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  datePickerContainer: {
    marginVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: "hidden",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: colors.background,
  },
  picker: {
    color: colors.textPrimary,
    height: 50,
  },
});
