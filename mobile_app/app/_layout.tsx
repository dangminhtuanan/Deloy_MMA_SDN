import Chatbot from "@/components/chatbot";
import Header from "@/components/layout/Header";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Slot, useSegments } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const segments = useSegments();
  const hiddenShellSegments = new Set([
    "admin",
    "manager",
    "staff",
    "auth",
    "payment",
  ]);
  const hideCustomerShell = hiddenShellSegments.has(segments[0] || "");

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <View style={{ flex: 1 }}>
            {!hideCustomerShell && <Header />}
            <View style={{ flex: 1 }}>
              <Slot />
            </View>
          </View>
          {!hideCustomerShell && <Chatbot />}
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
