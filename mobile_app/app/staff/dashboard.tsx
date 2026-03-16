import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { staffAPI } from "@/api";

const TEAL = "#0f766e";

const formatPrice = (p: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(p);

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", paid: "#3b82f6", shipped: "#8b5cf6", shipping: "#8b5cf6",
  completed: "#22c55e", cancelled: "#ef4444",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  shipping: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STAT_CARDS = [
  { key: "pendingOrders", label: "Pending Orders", icon: "clock", color: "#f59e0b" },
  { key: "shippingOrders", label: "Shipping Orders", icon: "truck", color: "#8b5cf6" },
  { key: "completedToday", label: "Completed Today", icon: "check-circle", color: "#22c55e" },
  { key: "lowStockProducts", label: "Low Stock Items", icon: "alert-triangle", color: "#ef4444" },
  { key: "totalOrders", label: "Total Orders", icon: "shopping-bag", color: "#3b82f6" },
  { key: "cancelledOrders", label: "Cancelled Orders", icon: "x-circle", color: "#6b7280" },
];

export default function StaffDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) { router.replace("/auth"); return; }
    fetchData();
  }, [authLoading, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        staffAPI.getStats(),
        staffAPI.getOrders({ page: 1, limit: 5 }),
      ]);
      setStats(statsRes.data || statsRes);
      const orders = ordersRes.data?.orders || ordersRes.orders || ordersRes.data || ordersRes || [];
      setRecentOrders(Array.isArray(orders) ? orders.slice(0, 5) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={TEAL} />
        <Text style={s.loadingTxt}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Staff Dashboard</Text>
          <Text style={s.subtitle}>Xin chào, {(user as any)?.username || user?.email}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/" as never)} style={s.homeBtn}>
          <Feather name="home" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={s.grid}>
        {STAT_CARDS.map((card) => (
          <View key={card.key} style={[s.statCard, { borderLeftColor: card.color }]}>
            <View style={[s.iconBox, { backgroundColor: card.color + "20" }]}>
              <Feather name={card.icon as any} size={22} color={card.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.statLabel}>{card.label}</Text>
              <Text style={s.statValue}>{stats?.[card.key] ?? 0}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Orders */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push("/staff/orders" as never)}>
            <Text style={s.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.length === 0 ? (
          <Text style={s.emptyTxt}>No orders yet</Text>
        ) : (
          recentOrders.map((order) => {
            const status = order.status || "pending";
            const color = STATUS_COLORS[status] || "#888";
            return (
              <View key={order._id} style={s.orderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.orderId}>#{(order._id || "").slice(-8).toUpperCase()}</Text>
                  <Text style={s.orderUser}>{order.user?.username || "N/A"}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={s.orderTotal}>{formatPrice(order.totalAmount || 0)}</Text>
                  <View style={[s.badge, { backgroundColor: color + "20", borderColor: color }]}>
                    <Text style={[s.badgeTxt, { color }]}>{STATUS_LABELS[status] || status}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push("/staff/orders" as never)}>
          <Text style={s.viewAllBtnTxt}>View All Orders</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingTxt: { color: "#666", fontSize: 15 },
  header: { backgroundColor: TEAL, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#fff" },
  subtitle: { fontSize: 13, color: "#99f6e4", marginTop: 4 },
  homeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  grid: { padding: 12, gap: 10 },
  statCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderLeftWidth: 4, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  statLabel: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: "900", color: "#1a1a1a" },
  section: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },
  viewAll: { fontSize: 13, color: TEAL, fontWeight: "600" },
  orderRow: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", elevation: 1 },
  orderId: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", marginBottom: 3 },
  orderUser: { fontSize: 12, color: "#888" },
  orderTotal: { fontSize: 14, fontWeight: "800", color: TEAL },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
  emptyTxt: { fontSize: 14, color: "#aaa", textAlign: "center", paddingVertical: 24 },
  viewAllBtn: { backgroundColor: TEAL, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  viewAllBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
