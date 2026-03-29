import { storage } from "@/lib/storage";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // Initialize database on app startup
    storage.ensureInitialized().catch((error) => {
      console.error("Failed to initialize database:", error);
    });
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
