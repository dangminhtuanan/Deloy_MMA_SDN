import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions, FlatList,
} from "react-native";
import { reportAPI } from "../../api/index";
import { FontAwesome5 } from "@expo/vector-icons";
import { BarChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;
const C = { primary: "#1e1b6e", bg: "#F5F5F5", white: "#FFF", text: "#333", light: "#666", border: "#E8E8E8", blue: "#3b82f6", red: "#ef4444", indigo: "#6366f1", green: "#10b981" };
const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"];
const TABS = [
  { key: "sales", label: "Sales", icon: "dollar-sign" },
  { key: "products", label: "Top Products", icon: "box" },
  { key: "category", label: "By Category", icon: "tags" },
  { key: "customers", label: "Customers", icon: "users" },
  { key: "inventory", label: "Inventory", icon: "warehouse" },
];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sales");
  const [salesData, setSalesData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [sales, products, category, customers, inventory] = await Promise.all([
        reportAPI.getSales(startDate, endDate), reportAPI.getTopProducts(10),
        reportAPI.getRevenueByCategory(), reportAPI.getCustomerStats(), reportAPI.getInventory(),
      ]);
      setSalesData(sales.data); setTopProducts(products.data || []);
      setRevenueByCategory(category.data || []); setCustomerStats(customers.data);
      setInventoryData(inventory.data);
    } catch { Alert.alert("Error", "Failed to load reports"); }
    finally { setLoading(false); }
  };

  const handleFilterSales = async () => {
    if (!startDate || !endDate) { Alert.alert("Error", "Select both dates (YYYY-MM-DD)"); return; }
    try { const r = await reportAPI.getSales(startDate, endDate); setSalesData(r.data); Alert.alert("Success", "Filtered!"); }
    catch { Alert.alert("Error", "Failed to filter"); }
  };

  const fmtPrice = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(p || 0);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /><Text style={s.loadText}>Loading reports...</Text></View>;

  const pieData = revenueByCategory?.map((item: any, i: number) => ({
    name: item.categoryName || "N/A", revenue: item.totalRevenue || 0,
    color: PIE_COLORS[i % PIE_COLORS.length], legendFontColor: C.text, legendFontSize: 11,
  })) || [];

  const barData = {
    labels: topProducts?.slice(0, 5).map((p: any) => (p.productInfo?.name || "").slice(0, 8)) || [],
    datasets: [{ data: topProducts?.slice(0, 5).map((p: any) => p.totalQuantity || 0) || [0] }],
  };

  return (
    <View style={s.container}>
      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, activeTab === t.key && s.tabActive]} onPress={() => setActiveTab(t.key)}>
            <FontAwesome5 name={t.icon} size={12} color={activeTab === t.key ? C.primary : C.light} style={{ marginRight: 6 }} />
            <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {/* Sales Tab */}
        {activeTab === "sales" && salesData && (
          <>
            <View style={s.filterCard}>
              <Text style={s.sectionTitle}>Filter by Date</Text>
              <TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="Start: YYYY-MM-DD" placeholderTextColor="#999" />
              <TextInput style={[s.input, { marginTop: 8 }]} value={endDate} onChangeText={setEndDate} placeholder="End: YYYY-MM-DD" placeholderTextColor="#999" />
              <TouchableOpacity style={s.filterBtn} onPress={handleFilterSales}><Text style={s.filterBtnText}>Apply Filter</Text></TouchableOpacity>
            </View>
            <View style={s.statsRow}>
              {[
                { t: "Total Sales", v: fmtPrice(salesData.totalSales), c: C.green },
                { t: "Orders", v: salesData.ordersCount?.toString(), c: C.blue },
                { t: "Avg Order", v: fmtPrice(salesData.avgOrderValue), c: C.indigo },
              ].map((st, i) => (
                <View key={i} style={s.statCard}><Text style={s.statLabel}>{st.t}</Text><Text style={[s.statVal, { color: st.c }]}>{st.v}</Text></View>
              ))}
            </View>
            {salesData.salesByDay?.length > 0 && (
              <View style={s.card}>
                <Text style={s.sectionTitle}>Daily Sales Breakdown</Text>
                {salesData.salesByDay.map((d: any, i: number) => (
                  <View key={i} style={s.row}><Text style={s.rowLeft}>{d._id?.date}</Text><Text style={s.rowMid}>{d.orders} orders</Text><Text style={s.rowRight}>{fmtPrice(d.sales)}</Text></View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Top Products Tab */}
        {activeTab === "products" && (
          <>
            {topProducts.length > 0 && (
              <View style={s.card}>
                <Text style={s.sectionTitle}>Top Products (Units Sold)</Text>
                <ScrollView horizontal>
                  <BarChart data={barData} width={Math.max(screenWidth - 48, 300)} height={220}
                    chartConfig={{ backgroundColor: C.white, backgroundGradientFrom: C.white, backgroundGradientTo: C.white, color: () => C.indigo, labelColor: () => C.light }}
                    style={{ borderRadius: 8 }} yAxisLabel="" yAxisSuffix="" />
                </ScrollView>
              </View>
            )}
            <View style={s.card}>
              <Text style={s.sectionTitle}>Product Details</Text>
              {topProducts.map((p: any, i: number) => (
                <View key={i} style={s.row}><Text style={[s.rowLeft, { flex: 2 }]}>{p.productInfo?.name}</Text><Text style={s.rowMid}>{p.totalQuantity} sold</Text><Text style={[s.rowRight, { color: C.green }]}>{fmtPrice(p.totalRevenue)}</Text></View>
              ))}
            </View>
          </>
        )}

        {/* Category Tab */}
        {activeTab === "category" && (
          <>
            {pieData.length > 0 && (
              <View style={s.card}>
                <Text style={s.sectionTitle}>Revenue by Category</Text>
                <PieChart data={pieData} width={screenWidth - 48} height={200}
                  chartConfig={{ color: () => C.text }} accessor="revenue" backgroundColor="transparent" paddingLeft="10" absolute />
              </View>
            )}
            <View style={s.card}>
              <Text style={s.sectionTitle}>Category Breakdown</Text>
              {revenueByCategory.map((c: any, i: number) => (
                <View key={i} style={s.row}><View style={{ flex: 1 }}><Text style={s.rowLeft}>{c.categoryName}</Text><Text style={{ fontSize: 12, color: C.light }}>{c.totalQuantity} units</Text></View><Text style={[s.rowRight, { color: C.indigo, fontWeight: "700" }]}>{fmtPrice(c.totalRevenue)}</Text></View>
              ))}
            </View>
          </>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && customerStats && (
          <>
            <View style={s.statsRow}>
              <View style={s.statCard}><Text style={s.statLabel}>Total</Text><Text style={[s.statVal, { color: C.blue }]}>{customerStats.totalCustomers}</Text></View>
              <View style={s.statCard}><Text style={s.statLabel}>New (30d)</Text><Text style={[s.statVal, { color: C.green }]}>{customerStats.newCustomers}</Text></View>
            </View>
            <View style={s.card}>
              <Text style={s.sectionTitle}>Top Customers</Text>
              {customerStats.topCustomers?.map((c: any, i: number) => (
                <View key={i} style={s.row}><View style={{ flex: 1 }}><Text style={s.rowLeft}>{c.userInfo?.username}</Text><Text style={{ fontSize: 12, color: C.light }}>{c.userInfo?.email}</Text></View><Text style={s.rowMid}>{c.orderCount} ord</Text><Text style={[s.rowRight, { color: C.green }]}>{fmtPrice(c.totalSpent)}</Text></View>
              ))}
            </View>
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && inventoryData && (
          <>
            <View style={s.statsRow}>
              {[
                { t: "Value", v: fmtPrice(inventoryData.inventoryValue?.totalValue), c: C.green },
                { t: "Products", v: inventoryData.inventoryValue?.totalProducts?.toString(), c: C.blue },
                { t: "Stock", v: inventoryData.inventoryValue?.totalStock?.toString(), c: C.indigo },
              ].map((st, i) => (
                <View key={i} style={s.statCard}><Text style={s.statLabel}>{st.t}</Text><Text style={[s.statVal, { color: st.c }]}>{st.v}</Text></View>
              ))}
            </View>
            <View style={s.card}>
              <View style={s.headerRow}>
                <FontAwesome5 name="exclamation-triangle" size={14} color="#f59e0b" style={{ marginRight: 8 }} />
                <Text style={s.sectionTitle}>Low Stock Products (Stock &lt; 10)</Text>
              </View>
              {inventoryData.lowStock?.map((p: any) => (
                <View key={p._id} style={s.row}><Text style={[s.rowLeft, { flex: 2 }]}>{p.name}</Text><View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}><Text style={{ fontSize: 12, color: "#D97706", fontWeight: "700" }}>{p.stock}</Text></View><Text style={s.rowRight}>{fmtPrice(p.price)}</Text></View>
              ))}
            </View>
            {inventoryData.outOfStock?.length > 0 && (
              <View style={s.card}>
                <View style={s.headerRow}>
                  <FontAwesome5 name="times-circle" size={14} color={C.red} style={{ marginRight: 8 }} />
                  <Text style={s.sectionTitle}>Out of Stock Products</Text>
                </View>
                {inventoryData.outOfStock.map((p: any) => (
                  <View key={p._id} style={s.row}><Text style={s.rowLeft}>{p.name}</Text><Text style={s.rowRight}>{fmtPrice(p.price)}</Text></View>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
  loadText: { marginTop: 12, fontSize: 14, color: C.light },
  tabBar: { maxHeight: 50, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabText: { fontSize: 13, color: C.light, fontWeight: "500" },
  tabTextActive: { color: C.primary, fontWeight: "700" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  filterCard: { backgroundColor: C.white, borderRadius: 10, padding: 14, marginBottom: 12, elevation: 1 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  filterBtn: { backgroundColor: C.primary, paddingVertical: 10, borderRadius: 8, alignItems: "center", marginTop: 10 },
  filterBtnText: { color: C.white, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 14, elevation: 1 },
  statLabel: { fontSize: 12, color: C.light },
  statVal: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  card: { backgroundColor: C.white, borderRadius: 10, padding: 14, marginBottom: 12, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: C.text },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  rowLeft: { flex: 1, fontSize: 13, color: C.text },
  rowMid: { fontSize: 12, color: C.light, marginHorizontal: 8 },
  rowRight: { fontSize: 13, fontWeight: "600", color: C.text },
});
