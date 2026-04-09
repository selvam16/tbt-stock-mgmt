import AppLayout from "@/components/AppLayout";
import { Bill, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ViewBillScreen() {
  const params = useLocalSearchParams();
  const companyId =
    typeof params.companyId === "string"
      ? params.companyId
      : params.companyId?.[0];
  const companyName =
    typeof params.companyName === "string"
      ? params.companyName
      : params.companyName?.[0];

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    if (companyId && typeof companyId === "string") {
      loadBills(companyId);
    }
  }, [companyId]);

  const loadBills = async (id: string) => {
    try {
      setLoading(true);
      const companyBills = await storage.getBills(id);
      setBills(companyBills);
    } catch (error) {
      console.error("Error loading bills:", error);
      Alert.alert("Error", "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Bill Details" isHome={false}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Bills for ${companyName}`} isHome={false}>
      <ScrollView style={styles.container}>
        {bills.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No bills added yet.</Text>
            <Text style={styles.emptySubtext}>
              Add bills using the bill button on the company list.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerText}>Bill Details</Text>
              <Text style={styles.headerSubtext}>
                Total bills: {bills.length}
              </Text>
            </View>

            {bills.map((bill, index) => (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.billHeader}>
                  <Text style={styles.billNumber}>Bill {index + 1}</Text>
                  <View style={styles.billBadge}>
                    <Text style={styles.billBadgeText}>
                      {bill.isBillable ? "Billable" : "Non-Billable"}
                    </Text>
                  </View>
                </View>

                {bill.details && (
                  <View style={styles.billField}>
                    <Text style={styles.fieldLabel}>Details</Text>
                    <Text style={styles.fieldValue}>{bill.details}</Text>
                  </View>
                )}

                {bill.count && (
                  <View style={styles.billField}>
                    <Text style={styles.fieldLabel}>Count</Text>
                    <Text style={styles.fieldValue}>{bill.count}</Text>
                  </View>
                )}

                {bill.billDetails && (
                  <View style={styles.billField}>
                    <Text style={styles.fieldLabel}>Bill Details</Text>
                    <Text style={styles.fieldValue}>{bill.billDetails}</Text>
                  </View>
                )}

                <Text style={styles.billDate}>
                  Saved: {new Date(bill.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    minHeight: 300,
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
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  billCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  billNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  billBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  billBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  billField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 14,
    color: colors.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  billDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
});
