import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title: string;
  children: React.ReactNode;
  hideClose?: boolean;
  footer?: React.ReactNode;
  isHome?: boolean;
};

export default function AppLayout({
  title,
  children,
  hideClose,
  footer,
  isHome,
}: Props) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.headerActions}>
          {!isHome && (
            <TouchableOpacity
              onPress={() => router.push("/")}
              style={styles.homeButton}
            >
              <MaterialIcons name="home" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          {!hideClose && (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>{children}</View>

      {/* FOOTER */}
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  homeButton: {
    padding: 8,
  },
  close: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 10,
    backgroundColor: "#fff",
  },
});
