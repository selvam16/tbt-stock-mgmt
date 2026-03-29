import AddPartyFAB from "@/components/AddPartyFAB";
import AppLayout from "@/components/AppLayout";
import CompanyCard from "@/components/CompanyCard";
import { Company, Party, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

export default function CompaniesScreen() {
  const router = useRouter();
  const { partyId, source = "add" } = useLocalSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyQuantities, setCompanyQuantities] = useState<
    Record<string, number>
  >({});
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const parties = await storage.getParties();
      const p = parties.find((p) => p.id === partyId);
      setParty(p || null);

      const comps = await storage.getCompanies(partyId as string);
      setCompanies(comps);

      const quantities = await Promise.all(
        comps.map(async (company) => {
          const items = await storage.getItems(company.id);
          const totalQuantity = items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          return [company.id, totalQuantity] as const;
        }),
      );
      setCompanyQuantities(Object.fromEntries(quantities));
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

  const handleEditCompany = (companyId: string) => {
    router.push({
      pathname: "/screens/companies/add-company",
      params: { partyId, companyId, source },
    });
  };

  const handleDeleteCompany = async (
    companyId: string,
    companyName: string,
  ) => {
    Alert.alert(
      "Delete Company",
      `Are you sure you want to delete ${companyName}?`,
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
              await storage.deleteCompany(companyId);
              loadData();
              Alert.alert("Success", "Company deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete company");
              console.error(error);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleAddCompany = () => {
    router.push({
      pathname: "/screens/companies/add-company",
      params: { partyId, source },
    });
  };

  const renderCompany = ({ item }: { item: Company }) => (
    <CompanyCard
      company={item}
      totalQuantity={companyQuantities[item.id] ?? 0}
      onEdit={() => handleEditCompany(item.id)}
      onDelete={() => handleDeleteCompany(item.id, item.companyName)}
    />
  );

  if (loading) {
    return (
      <AppLayout title="Companies">
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Companies for ${party?.name || "Party"}`}>
      <View style={styles.container}>
        {companies.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No companies added yet.</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add a company.
            </Text>
          </View>
        ) : (
          <FlatList
            data={companies}
            keyExtractor={(item) => item.id}
            renderItem={renderCompany}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
      <AddPartyFAB onPress={handleAddCompany} />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: {
    padding: 16,
  },
  companyItem: {
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
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
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
