import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { FontAwesome5 } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, Alert, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const TEAL = "#0f766e";

export default function ManagerLayout() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      router.replace("/auth");
    } catch (e) {
      Alert.alert("Error", "Logout failed");
    }
  };

  const CustomDrawerContent = (props: any) => (
    <View style={{ flex: 1, backgroundColor: TEAL }}>
      <DrawerContentScrollView {...props}>
        <View style={{ padding: 20, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)", marginBottom: 10 }}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#fff" }}
            resizeMode="contain"
          />
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 12 }}>Manager Portal</Text>
        </View>
        <DrawerItemList {...props} />
        <DrawerItem
          label="Home"
          icon={({ color, size }) => <FontAwesome5 name="home" color={color} size={size} />}
          inactiveTintColor="#99f6e4"
          activeTintColor="#fff"
          labelStyle={{ fontSize: 14, fontWeight: "600", marginLeft: -8 }}
          onPress={() => router.replace("/")}
          style={{ borderRadius: 10, marginVertical: 2, marginHorizontal: 8 }}
        />
      </DrawerContentScrollView>
      <TouchableOpacity
        style={{ padding: 16, backgroundColor: "rgba(255,255,255,0.1)", margin: 16, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", gap: 10 }}
        onPress={handleLogout}
      >
        <FontAwesome5 name="sign-out-alt" size={16} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: TEAL, elevation: 0, shadowOpacity: 0 },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "800", fontSize: 18 },
          drawerActiveTintColor: "#fff",
          drawerActiveBackgroundColor: "rgba(255,255,255,0.15)",
          drawerInactiveTintColor: "#99f6e4",
          drawerStyle: { backgroundColor: TEAL, width: 280 },
          drawerLabelStyle: { fontSize: 14, fontWeight: "600", marginLeft: -8 },
          drawerItemStyle: { borderRadius: 10, marginVertical: 2, marginHorizontal: 8 },
        }}
      >
        <Drawer.Screen name="dashboard" options={{ title: "Dashboard", drawerLabel: "Dashboard", drawerIcon: ({ color, size }) => <FontAwesome5 name="chart-line" color={color} size={size} /> }} />
        <Drawer.Screen name="orders" options={{ title: "Orders", drawerLabel: "Orders", drawerIcon: ({ color, size }) => <FontAwesome5 name="shopping-cart" color={color} size={size} /> }} />
        <Drawer.Screen name="products" options={{ title: "Products", drawerLabel: "Products", drawerIcon: ({ color, size }) => <FontAwesome5 name="box" color={color} size={size} /> }} />
        <Drawer.Screen name="categories" options={{ title: "Categories", drawerLabel: "Categories", drawerIcon: ({ color, size }) => <FontAwesome5 name="tags" color={color} size={size} /> }} />
        <Drawer.Screen name="reports" options={{ title: "Reports", drawerLabel: "Reports", drawerIcon: ({ color, size }) => <FontAwesome5 name="chart-bar" color={color} size={size} /> }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
