import { managerAPI } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: W } = Dimensions.get("window");

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(price);

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  shipped: "#8b5cf6",
  shipping: "#8b5cf6",
  completed: "#22c55e",
  cancelled: "#ef4444",
  delivered: "#10b981",
};

function StatCard({ title, value, icon, color }: any) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Feather name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const NAV_ITEMS = [
  { label: "Orders", icon: "shopping-cart", route: "/manager/orders" },
  { label: "Products", icon: "package", route: "/manager/products" },
  { label: "Categories", icon: "tag", route: "/manager/categories" },
  { label: "Reports", icon: "bar-chart-2", route: "/manager/reports" },
];

export default function ManagerDashboard() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    isManager,
    isAdmin,
  } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || (!isManager?.() && !isAdmin?.())) {
      router.replace("/auth");
      return;
    }

    fetchData();
  }, [authLoading, isAuthenticated, isManager, isAdmin, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        managerAPI.getStats(),
        managerAPI.getOrders({ limit: 5 }),
      ]);

      const statsData = statsRes?.data || statsRes;
      const orders =
        ordersRes?.data?.orders ||
        ordersRes?.orders ||
        statsData?.recentOrders ||
        [];

      setStats(statsData);
      setRecentOrders(Array.isArray(orders) ? orders.slice(0, 5) : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingTxt}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Manager Dashboard</Text>
          <Text style={styles.subGreeting}>
            Welcome, {(user as any)?.username || user?.email}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.homeBtn}
        >
          <Feather name="home" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.navGrid}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as never)}
            style={styles.navCard}
          >
            <Feather name={item.icon as any} size={26} color="#1a1a1a" />
            <Text style={styles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats?.totalRevenue || 0)}
          icon="trending-up"
          color="#22c55e"
        />
        <StatCard
          title="New Orders (30 Days)"
          value={stats?.newOrdersCount ?? stats?.newOrders ?? 0}
          icon="shopping-cart"
          color="#3b82f6"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon="package"
          color="#8b5cf6"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          icon="clock"
          color="#f59e0b"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push("/manager/orders" as never)}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <Text style={styles.emptyTxt}>No orders yet</Text>
        ) : (
          recentOrders.map((order) => {
            const status = order.status || "pending";
            const color = STATUS_COLORS[status] || "#888";
            const customerName = [
              order.shippingAddress?.firstName,
              order.shippingAddress?.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <View key={order._id || order.id} style={styles.orderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderIdTxt}>
                    #{(order._id || order.id || "").slice(-8).toUpperCase()}
                  </Text>
                  <Text style={styles.orderCustomer}>
                    {customerName || order.user?.username || order.email || "N/A"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={styles.orderTotal}>
                    {formatPrice(order.totalAmount || 0)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${color}20`, borderColor: color },
                    ]}
                  >
                    <Text style={[styles.statusTxt, { color }]}>{status}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingTxt: { color: "#666", fontSize: 15 },
  header: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 22, fontWeight: "800", color: "#fff" },
  subGreeting: { fontSize: 13, color: "#aaa", marginTop: 4 },
  homeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  navGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  navCard: {
    width: (W - 48) / 2,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  navLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  section: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  viewAll: { fontSize: 13, color: "#3b82f6", fontWeight: "600" },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statTitle: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  orderRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  orderIdTxt: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", marginBottom: 3 },
  orderCustomer: { fontSize: 12, color: "#888" },
  orderTotal: { fontSize: 14, fontWeight: "800", color: "#1a1a1a" },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusTxt: { fontSize: 10, fontWeight: "700" },
  emptyTxt: { fontSize: 14, color: "#aaa", textAlign: "center", paddingVertical: 24 },
});
