import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function MultiFAB() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <View style={{ position: "absolute", bottom: 20, right: 20 }}>
      {/* Sub Buttons */}
      {open && (
        <>
          <TouchableOpacity
            onPress={() => router.push("/party/add")}
            style={fabSmall}
          >
            <Text style={fabText}>Party</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/product/add")}
            style={[fabSmall, { bottom: 70 }]}
          >
            <Text style={fabText}>Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/company/add")}
            style={[fabSmall, { bottom: 140 }]}
          >
            <Text style={fabText}>Company</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Main FAB */}
      <TouchableOpacity onPress={() => setOpen(!open)} style={fabMain}>
        <Text style={{ color: "#fff", fontSize: 24 }}>{open ? "×" : "+"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const fabMain = {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: "#007bff",
  justifyContent: "center",
  alignItems: "center",
};

const fabSmall = {
  position: "absolute" as const,
  bottom: 70,
  right: 0,
  backgroundColor: "#28a745",
  padding: 10,
  borderRadius: 20,
};

const fabText = {
  color: "#fff",
};
