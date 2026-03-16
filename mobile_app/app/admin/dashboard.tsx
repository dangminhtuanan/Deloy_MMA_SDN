import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { statsAPI } from "../../api/index";
import { FontAwesome5 } from "@expo/vector-icons";
import { LineChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const COLORS = {
  primary: "#1e1b6e",
  bg: "#F5F5F5",
  white: "#FFFFFF",
  text: "#333",
  lightText: "#666",
  border: "#E8E8E8",
  green: "#10b981",
  blue: "#3b82f6",
  orange: "#f97316",
  indigo: "#6366f1",
  yellow: "#fbbf24",
  purple: "#a855f7",
  red: "#ef4444",
  gray: "#6b7280",
};

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.yellow,
  paid: COLORS.blue,
  shipped: COLORS.purple,
  completed: COLORS.green,
  cancelled: COLORS.red,
};

const STATUS_BG: Record<string, string> = {
  pending: "#FEF3C7",
  paid: "#DBEAFE",
  shipped: "#EDE9FE",
  completed: "#D1FAE5",
  cancelled: "#FEE2E2",
};

const STATUS_TEXT: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await statsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load data</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Stats cards data
  const stats = [
    {
      title: "Total Revenue",
      value: formatPrice(dashboardData.totalRevenue || 0),
      color: COLORS.green,
    },
    {
      title: "New Users (30d)",
      value: (dashboardData.newUsersCount || 0).toString(),
      color: COLORS.blue,
    },
    {
      title: "Total Orders",
      value: (dashboardData.totalOrders || 0).toString(),
      color: COLORS.orange,
    },
    {
      title: "Total Products",
      value: (dashboardData.totalProducts || 0).toString(),
      color: COLORS.purple,
    },
  ];

  // Revenue chart data
  const revenueLabels =
    dashboardData.monthlyRevenue?.map(
      (item: any) => `${MONTH_NAMES[item._id.month - 1]}`
    ) || [];
  const revenueValues =
    dashboardData.monthlyRevenue?.map((item: any) => item.revenue) || [];

  const lineChartData = {
    labels: revenueLabels.length > 0 ? revenueLabels : ["N/A"],
    datasets: [
      {
        data: revenueValues.length > 0 ? revenueValues : [0],
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Pie chart data for order status
  const pieDataRaw =
    dashboardData.ordersByStatus?.map((item: any) => ({
      name: STATUS_TEXT[item._id] || item._id,
      count: item.count,
      color: STATUS_COLORS[item._id] || COLORS.gray,
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    })) || [];

  const pieData = pieDataRaw.length > 0 ? pieDataRaw : [
    {
      name: "No Data",
      count: 1,
      color: COLORS.border,
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    }
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statTitle}>{stat.title}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Revenue Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Last 6 Months</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={lineChartData}
              width={Math.max(screenWidth - 48, revenueLabels.length * 60)}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                labelColor: () => COLORS.lightText,
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: COLORS.indigo,
                },
              }}
              bezier
              style={styles.chart}
              formatYLabel={(value) => {
                const num = Number(value);
                if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
                return value;
              }}
            />
          </ScrollView>
        </View>

      {/* Orders by Status Pie Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Orders by Status</Text>
        <PieChart
            data={pieData}
            width={screenWidth - 48}
            height={200}
            chartConfig={{
              color: () => COLORS.text,
            }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="10"
          absolute
        />
      </View>

      {/* Recent Orders */}
      <View style={styles.ordersCard}>
        <View style={styles.ordersHeader}>
          <Text style={styles.chartTitle}>Recent Orders</Text>
          <TouchableOpacity
            onPress={() => router.push("/admin/orders")}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {dashboardData.recentOrders?.map((order: any) => (
          <View key={order._id} style={styles.orderRow}>
            <View style={styles.orderLeft}>
              <Text style={styles.orderId}>
                #{order._id?.slice(-8).toUpperCase()}
              </Text>
              <Text style={styles.orderCustomer}>
                {order.user?.username || order.email || "N/A"}
              </Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>
                {formatPrice(order.totalAmount || 0)}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      STATUS_BG[order.status] || "#F3F4F6",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        STATUS_COLORS[order.status] || COLORS.gray,
                    },
                  ]}
                >
                  {STATUS_TEXT[order.status] || order.status}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {(!dashboardData.recentOrders ||
          dashboardData.recentOrders.length === 0) && (
          <Text style={styles.emptyText}>No recent orders</Text>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.lightText,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.red,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    width: (screenWidth - 48) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.lightText,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
  },
  ordersCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ordersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  viewAllText: {
    color: COLORS.indigo,
    fontSize: 13,
    fontWeight: "600",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.indigo,
  },
  orderCustomer: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 2,
  },
  orderRight: {
    alignItems: "flex-end",
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    padding: 24,
    color: COLORS.lightText,
    fontSize: 14,
  },
});
