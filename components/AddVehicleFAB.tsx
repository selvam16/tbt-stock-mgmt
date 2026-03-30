import { colors } from "@/theme/color";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";

interface AddVehicleFABProps {
  partyId?: string;
  onPress?: () => void;
}

export default function AddVehicleFAB({
  partyId,
  onPress,
}: AddVehicleFABProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      if (partyId) {
        router.push({
          pathname: "/screens/vehicles/add-vehicle",
          params: { partyId },
        });
      } else {
        router.push("/screens/vehicles/add-vehicle");
      }
    }
  };

  return (
    <View style={{ position: "absolute", bottom: 20, right: 20 }}>
      <TouchableOpacity
        onPress={handlePress}
        style={{
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
        }}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
