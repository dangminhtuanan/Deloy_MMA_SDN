import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, RefreshControl,
} from "react-native";
import { staffAPI, orderAPI } from "../../api/index";
import { FontAwesome5 } from "@expo/vector-icons";

const TEAL = "#0f766e";
const C = { primary: TEAL, bg: "#F5F5F5", white: "#FFF", text: "#333", light: "#666", border: "#E8E8E8", blue: "#3b82f6", red: "#ef4444", green: "#10b981", yellow: "#fbbf24", purple: "#a855f7" };
const STATUS_COLORS: Record<string, string> = { pending: C.yellow, paid: C.blue, shipped: C.purple, shipping: C.purple, completed: C.green, cancelled: C.red };
const STATUS_BG: Record<string, string> = { pending: "#FEF3C7", paid: "#DBEAFE", shipped: "#EDE9FE", shipping: "#EDE9FE", completed: "#D1FAE5", cancelled: "#FEE2E2" };
const STATUS_TEXT: Record<string, string> = { pending: "Pending", paid: "Paid", shipped: "Shipped", shipping: "Shipped", completed: "Completed", cancelled: "Cancelled" };
const FILTER_STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"];
const SORT_OPTIONS = [
  { label: "Default", v: "default" }, { label: "Date ↓", v: "date-desc" },
  { label: "Date ↑", v: "date-asc" }, { label: "Total ↓", v: "total-desc" }, { label: "Total ↑", v: "total-asc" },
];

export default function StaffOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showFilterMenu, setShowFilterMenu] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const r = await staffAPI.getOrders({ page: 1, limit: 100 });
      const list = r.data?.orders || r.orders || r.data || r || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch { Alert.alert("Error", "Failed to load orders"); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await staffAPI.getOrders({ page: 1, limit: 100 });
      const list = r.data?.orders || r.orders || r.data || r || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  const formatPrice = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(p);
  const formatDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  const openDetail = async (order: any) => {
    try {
      const r = await orderAPI.getById(order._id);
      setSelectedOrder(r); setShowDetail(true);
    } catch { Alert.alert("Error", "Failed to load details"); }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await staffAPI.updateOrderStatus(orderId, newStatus);
      Alert.alert("Success", "Status updated!"); fetchOrders();
    } catch (e: any) { Alert.alert("Error", e.response?.data?.message || "Failed to update"); }
  };

  const filtered = orders.filter(o => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s || o._id?.toLowerCase().includes(s) || o.user?.username?.toLowerCase().includes(s) || o.email?.toLowerCase().includes(s);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "date-desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "date-asc": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "total-desc": return b.totalAmount - a.totalAmount;
      case "total-asc": return a.totalAmount - b.totalAmount;
      default: return 0;
    }
  });

  const renderOrder = ({ item }: any) => (
    <View style={st.card}>
      <View style={st.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={st.orderId}>#{item._id?.slice(-8).toUpperCase()}</Text>
          <Text style={st.orderUser}>{item.user?.username || item.email || "N/A"}</Text>
          <Text style={st.orderDate}><FontAwesome5 name="calendar-alt" size={11} color={C.light} /> {formatDate(item.createdAt)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={st.orderTotal}>{formatPrice(item.totalAmount)}</Text>
          <View style={[st.statusBadge, { backgroundColor: STATUS_BG[item.status] || "#F3F4F6" }]}>
            <Text style={[st.statusText, { color: STATUS_COLORS[item.status] || C.light }]}>{STATUS_TEXT[item.status] || item.status}</Text>
          </View>
        </View>
      </View>
      <View style={st.actions}>
        <TouchableOpacity style={st.viewBtn} onPress={() => openDetail(item)}>
          <FontAwesome5 name="eye" size={12} color={C.blue} style={{ marginRight: 6 }} />
          <Text style={st.viewText}>Detail</Text>
        </TouchableOpacity>
        {(item.status === "pending" || item.status === "paid") && (
          <TouchableOpacity style={st.shipBtn} onPress={() => handleUpdateStatus(item._id, "shipped")}>
            <FontAwesome5 name="truck" size={12} color={C.purple} style={{ marginRight: 6 }} />
            <Text style={[st.viewText, { color: C.purple }]}>Ship</Text>
          </TouchableOpacity>
        )}
        {(item.status === "shipping" || item.status === "shipped") && (
          <TouchableOpacity style={st.completeBtn} onPress={() => handleUpdateStatus(item._id, "completed")}>
            <FontAwesome5 name="check" size={12} color={C.green} style={{ marginRight: 6 }} />
            <Text style={[st.viewText, { color: C.green }]}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={st.container}>
      <View style={st.toolbar}>
        <View style={st.searchContainer}>
          <FontAwesome5 name="search" size={14} color="#999" style={st.searchIcon} />
          <TextInput style={st.search} placeholder="Search orders..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#999" />
        </View>
      </View>
      <View style={st.filterRow}>
        <TouchableOpacity style={st.chip} onPress={() => setShowFilterMenu(showFilterMenu === "status" ? null : "status")}>
          <FontAwesome5 name="clipboard-list" size={12} color={C.text} style={{ marginRight: 6 }} />
          <Text style={st.chipText}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.chip} onPress={() => setShowFilterMenu(showFilterMenu === "sort" ? null : "sort")}>
          <FontAwesome5 name="sort" size={12} color={C.text} style={{ marginRight: 6 }} />
          <Text style={st.chipText}>Sort</Text>
        </TouchableOpacity>
      </View>
      {showFilterMenu === "status" && (
        <View style={st.dropdown}>
          <TouchableOpacity style={st.dropItem} onPress={() => { setStatusFilter(""); setShowFilterMenu(null); }}><Text style={!statusFilter ? st.dropActive : st.dropText}>All</Text></TouchableOpacity>
          {FILTER_STATUSES.map(s => (
            <TouchableOpacity key={s} style={st.dropItem} onPress={() => { setStatusFilter(s); setShowFilterMenu(null); }}>
              <Text style={statusFilter === s ? st.dropActive : st.dropText}>{STATUS_TEXT[s]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showFilterMenu === "sort" && (
        <View style={st.dropdown}>{SORT_OPTIONS.map(o => (
          <TouchableOpacity key={o.v} style={st.dropItem} onPress={() => { setSortBy(o.v); setShowFilterMenu(null); }}>
            <Text style={sortBy === o.v ? st.dropActive : st.dropText}>{o.label}</Text>
          </TouchableOpacity>
        ))}</View>
      )}
      {loading ? (
        <View style={st.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList data={sorted} keyExtractor={i => i._id} renderItem={renderOrder}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={st.empty}>No orders found</Text>}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <ScrollView>
              <Text style={st.modalTitle}>Order Detail</Text>
              {selectedOrder && (
                <>
                  <Text style={st.detailLabel}>Order ID</Text>
                  <Text style={st.detailValue}>#{(selectedOrder.order?._id || selectedOrder._id)?.slice(-8).toUpperCase()}</Text>
                  <Text style={st.detailLabel}>Customer</Text>
                  <Text style={st.detailValue}>{selectedOrder.order?.user?.username || selectedOrder.order?.email || "N/A"}</Text>
                  <Text style={st.detailLabel}>Date</Text>
                  <Text style={st.detailValue}>{formatDate(selectedOrder.order?.createdAt || selectedOrder.createdAt)}</Text>
                  <Text style={st.detailLabel}>Status</Text>
                  <View style={[st.statusBadge, { backgroundColor: STATUS_BG[selectedOrder.order?.status || selectedOrder.status] || "#F3F4F6", alignSelf: "flex-start", marginBottom: 8 }]}>
                    <Text style={[st.statusText, { color: STATUS_COLORS[selectedOrder.order?.status || selectedOrder.status] || C.light }]}>{STATUS_TEXT[selectedOrder.order?.status || selectedOrder.status] || selectedOrder.order?.status || selectedOrder.status}</Text>
                  </View>
                  <Text style={st.detailLabel}>Shipping Address</Text>
                  <Text style={st.detailValue}>
                    {selectedOrder.order?.shippingAddress ? (
                      typeof selectedOrder.order.shippingAddress === "string" ? selectedOrder.order.shippingAddress :
                      `${selectedOrder.order.shippingAddress.firstName || ""} ${selectedOrder.order.shippingAddress.lastName || ""}, ${selectedOrder.order.shippingAddress.phone || ""}, ${selectedOrder.order.shippingAddress.address || ""}`
                    ) : "N/A"}
                  </Text>
                  <Text style={[st.detailLabel, { marginTop: 16 }]}>Items</Text>
                  {(selectedOrder.items || []).map((item: any, i: number) => (
                    <View key={i} style={st.itemRow}>
                      <Text style={{ flex: 1, fontSize: 13, color: C.text }}>{item.product?.name || "N/A"}</Text>
                      <Text style={{ fontSize: 13, color: C.light }}>x{item.quantity}</Text>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, marginLeft: 8 }}>{formatPrice(item.price * item.quantity)}</Text>
                    </View>
                  ))}
                  <View style={st.totalRow}>
                    <Text style={st.totalLabel}>Total</Text>
                    <Text style={st.totalValue}>{formatPrice(selectedOrder.order?.totalAmount || selectedOrder.totalAmount || 0)}</Text>
                  </View>
                </>
              )}
              <TouchableOpacity style={st.closeBtn} onPress={() => setShowDetail(false)}><Text style={st.closeText}>Close</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  toolbar: { padding: 12, paddingBottom: 0 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 8, fontSize: 14, color: C.text },
  filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 8, gap: 8, marginBottom: 4 },
  chip: { backgroundColor: C.white, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center" },
  chipText: { fontSize: 13, color: C.text },
  dropdown: { backgroundColor: C.white, marginHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
  dropItem: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  dropText: { fontSize: 14, color: C.text },
  dropActive: { fontSize: 14, color: TEAL, fontWeight: "700" },
  card: { backgroundColor: C.white, borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { fontSize: 14, fontWeight: "700", color: TEAL },
  orderUser: { fontSize: 13, color: C.light, marginTop: 2 },
  orderDate: { fontSize: 12, color: C.light, marginTop: 2 },
  orderTotal: { fontSize: 15, fontWeight: "700", color: C.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: "600" },
  actions: { flexDirection: "row", marginTop: 10, gap: 8 },
  viewBtn: { flex: 1, backgroundColor: "#EFF6FF", paddingVertical: 8, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  shipBtn: { flex: 1, backgroundColor: "#EDE9FE", paddingVertical: 8, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  completeBtn: { flex: 1, backgroundColor: "#D1FAE5", paddingVertical: 8, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  viewText: { color: C.blue, fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", padding: 40, color: C.light, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  modalContent: { backgroundColor: C.white, borderRadius: 12, padding: 20, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 12 },
  detailLabel: { fontSize: 12, fontWeight: "600", color: C.light, marginTop: 8 },
  detailValue: { fontSize: 14, color: C.text, marginTop: 2 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTopWidth: 2, borderTopColor: C.border },
  totalLabel: { fontSize: 16, fontWeight: "700", color: C.text },
  totalValue: { fontSize: 18, fontWeight: "700", color: TEAL },
  closeBtn: { backgroundColor: C.border, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 16 },
  closeText: { color: C.text, fontWeight: "600" },
});
