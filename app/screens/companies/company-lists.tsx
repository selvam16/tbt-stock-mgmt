import AppLayout from "@/components/AppLayout";
import CompanyCard from "@/components/CompanyCard";
import { Company, Party, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CompaniesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const partyId =
    typeof params.partyId === "string" ? params.partyId : params.partyId?.[0];
  const vehicleId =
    typeof params.vehicleId === "string"
      ? params.vehicleId
      : params.vehicleId?.[0];
  console.log("CompaniesScreen params:", { partyId, vehicleId, params });
  const source = (
    typeof params.source === "string"
      ? params.source
      : params.source?.[0] || "add"
  ) as "add" | "unload";
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

  const handleCompanySelect = (company: Company) => {
    router.push({
      pathname: "/screens/products/company-items",
      params: {
        companyId: company.id,
        companyName: company.companyName,
        vehicleId,
        source,
      },
    });
  };

  const renderCompany = ({ item }: { item: Company }) => (
    <TouchableOpacity
      onPress={() =>
        source === "add"
          ? handleCompanySelect(item)
          : handleEditCompany(item.id)
      }
      activeOpacity={0.7}
    >
      <CompanyCard
        company={item}
        totalQuantity={companyQuantities[item.id] ?? 0}
        onEdit={() => handleEditCompany(item.id)}
        onDelete={() => handleDeleteCompany(item.id, item.companyName)}
        source={source as "add" | "unload"}
        showActions={source !== "add"}
        vehicleId={vehicleId}
      />
    </TouchableOpacity>
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
      {source !== "add" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddCompany}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 16,
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
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
