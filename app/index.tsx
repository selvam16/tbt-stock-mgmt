import { Godown, storage } from "@/lib/storage";
import { colors } from "@/theme/color";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppLayout from "../components/AppLayout";

export default function Home() {
  const router = useRouter();
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGodowns = async () => {
      setLoading(true);
      try {
        const data = await storage.getGodowns();
        setGodowns(data);
      } catch (error) {
        console.error("Error loading godowns:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGodowns();
  }, []);

  return (
    <AppLayout
      title="Dashboard"
      hideClose
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
      <Text style={styles.sectionTitle}>Godowns</Text>
      <TouchableOpacity
        onPress={() => storage.downloadJSON()}
        style={{ marginBottom: 12 }}
      >
        <Text style={{ color: colors.primary }}>Download Data</Text>
      </TouchableOpacity>

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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text>{item.name}</Text>
            </View>
          )}
        />
      )}
    </AppLayout>
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
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginBottom: 8,
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
});
