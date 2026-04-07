/**
 * Development/Debug Utility
 * Provides functions for testing and development
 * Add this to your app layout or create a hidden dev menu
 */

import { clearAllData, initializeMockData } from "@/lib/mockDataHelper";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DevMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const DevMenu: React.FC<DevMenuProps> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleInitializeMockData = async () => {
    try {
      setLoading(true);
      await initializeMockData();
      Alert.alert(
        "Success",
        "Mock data has been initialized. Please restart the app to see the changes.",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to initialize mock data",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all data? This cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            try {
              setLoading(true);
              await clearAllData();
              Alert.alert(
                "Success",
                "All data has been cleared. Please restart the app.",
              );
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to clear data",
              );
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Developer Menu</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mock Data</Text>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleInitializeMockData}
              disabled={loading}
            >
              <MaterialIcons name="storage" size={20} color="#fff" />
              <Text style={styles.buttonText}>Initialize Mock Data</Text>
            </TouchableOpacity>
            <Text style={styles.description}>
              Clears all existing data and loads sample mock data for testing
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleClearData}
              disabled={loading}
            >
              <MaterialIcons name="delete" size={20} color="#fff" />
              <Text style={styles.buttonText}>Clear All Data</Text>
            </TouchableOpacity>
            <Text style={styles.description}>
              Removes all parties, companies, items, vehicles, and stock data
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Info</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                • Mock data includes 5 sample parties{"\n"}• Multiple companies,
                items, and vehicles per party{"\n"}• Random quantity and vehicle
                numbers{"\n"}• Data spans the last 30 days{"\n"}• Use for
                testing UI and features
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  dangerButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  description: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  infoText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },
});
