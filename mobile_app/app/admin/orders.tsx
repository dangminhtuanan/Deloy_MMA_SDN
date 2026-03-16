import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, RefreshControl,
} from "react-native";
import { orderAPI } from "../../api/index";
import { FontAwesome5 } from "@expo/vector-icons";

const C = { primary: "#1e1b6e", bg: "#F5F5F5", white: "#FFF", text: "#333", light: "#666", border: "#E8E8E8", blue: "#3b82f6", red: "#ef4444", indigo: "#6366f1", green: "#10b981", yellow: "#fbbf24", purple: "#a855f7" };
const STATUS_COLORS: Record<string, string> = { pending: C.yellow, paid: C.blue, shipped: C.purple, completed: C.green, cancelled: C.red };
const STATUS_BG: Record<string, string> = { pending: "#FEF3C7", paid: "#DBEAFE", shipped: "#EDE9FE", completed: "#D1FAE5", cancelled: "#FEE2E2" };
const STATUS_TEXT: Record<string, string> = { pending: "Pending", paid: "Paid", shipped: "Shipped", completed: "Completed", cancelled: "Cancelled" };
const STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"];
const SORT_OPTIONS = [
  { label: "Default", v: "default" }, { label: "Date ↓", v: "date-desc" },
  { label: "Date ↑", v: "date-asc" }, { label: "Total ↓", v: "total-desc" },
  { label: "Total ↑", v: "total-asc" },
];

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showFilterMenu, setShowFilterMenu] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showEditStatus, setShowEditStatus] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try { setLoading(true); const r = await orderAPI.getAll(); setOrders(r.data || r); }
    catch { Alert.alert("Error", "Failed to load orders"); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { const r = await orderAPI.getAll(); setOrders(r.data || r); } catch {}
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

  const openEditStatus = (order: any) => { setEditingOrder(order); setNewStatus(order.status); setShowEditStatus(true); };

  const handleUpdateStatus = async () => {
    try {
      await orderAPI.update(editingOrder._id, { status: newStatus });
      Alert.alert("Success", "Status updated!"); setShowEditStatus(false); fetchOrders();
    } catch { Alert.alert("Error", "Failed to update"); }
  };

  const handleDelete = (order: any) => {
    Alert.alert("Delete Order", `Delete order #${order._id?.slice(-8).toUpperCase()}?`, [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await orderAPI.delete(order._id); Alert.alert("Success", "Deleted!"); fetchOrders(); }
        catch { Alert.alert("Error", "Failed to delete"); }
      }},
    ]);
  };

  const filtered = orders.filter(o => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s || o._id?.toLowerCase().includes(s) || o.email?.toLowerCase().includes(s) ||
      o.shippingAddress?.firstName?.toLowerCase().includes(s) || o.shippingAddress?.phone?.toLowerCase().includes(s);
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
          <Text style={st.orderEmail}>{item.email || "N/A"}</Text>
          <Text style={st.orderDate}><FontAwesome5 name="calendar-alt" size={12} color={C.light} /> {formatDate(item.createdAt)}</Text>
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
        <TouchableOpacity style={st.editBtn} onPress={() => openEditStatus(item)}>
          <FontAwesome5 name="edit" size={12} color={C.green} style={{ marginRight: 6 }} />
          <Text style={st.viewText}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.delBtn} onPress={() => handleDelete(item)}>
          <FontAwesome5 name="trash-alt" size={14} color={C.red} />
        </TouchableOpacity>
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
          {STATUSES.map(s => (
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
                  <Text style={st.detailLabel}>Email</Text>
                  <Text style={st.detailValue}>{selectedOrder.order?.email || selectedOrder.email || "N/A"}</Text>
                  <Text style={st.detailLabel}>Date</Text>
                  <Text style={st.detailValue}>{formatDate(selectedOrder.order?.createdAt || selectedOrder.createdAt)}</Text>
                  <Text style={st.detailLabel}>Status</Text>
                  <View style={[st.statusBadge, { backgroundColor: STATUS_BG[selectedOrder.order?.status || selectedOrder.status] || "#F3F4F6", alignSelf: "flex-start", marginBottom: 8 }]}>
                    <Text style={[st.statusText, { color: STATUS_COLORS[selectedOrder.order?.status || selectedOrder.status] || C.light }]}>{STATUS_TEXT[selectedOrder.order?.status || selectedOrder.status]}</Text>
                  </View>
                  <Text style={st.detailLabel}>Shipping Address</Text>
                  <Text style={st.detailValue}>
                    {selectedOrder.order?.shippingAddress ? (
                      typeof selectedOrder.order.shippingAddress === "string" ? selectedOrder.order.shippingAddress :
                      `${selectedOrder.order.shippingAddress.firstName || ""} ${selectedOrder.order.shippingAddress.lastName || ""}, ${selectedOrder.order.shippingAddress.phone || ""}, ${selectedOrder.order.shippingAddress.address || ""}, ${selectedOrder.order.shippingAddress.city || ""}`
                    ) : "N/A"}
                  </Text>
                  <Text style={st.detailLabel}>Payment</Text>
                  <Text style={st.detailValue}>
                    {(selectedOrder.order?.paymentMethod || selectedOrder.paymentMethod) === "vnpay" ? "VNPay" :
                     (selectedOrder.order?.paymentMethod || selectedOrder.paymentMethod) === "cod" ? "COD" : "N/A"}
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

      {/* Edit Status Modal */}
      <Modal visible={showEditStatus} animationType="fade" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <Text style={st.modalTitle}>Update Status</Text>
            {editingOrder && <Text style={{ fontSize: 13, color: C.light, marginBottom: 12 }}>Order #{editingOrder._id?.slice(-8).toUpperCase()}</Text>}
            {STATUSES.map(s => (
              <TouchableOpacity key={s} style={[st.statusOption, newStatus === s && st.statusOptionActive]} onPress={() => setNewStatus(s)}>
                <Text style={[st.statusOptionText, newStatus === s && st.statusOptionTextActive]}>{STATUS_TEXT[s]}</Text>
              </TouchableOpacity>
            ))}
            <View style={st.modalActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setShowEditStatus(false)}><Text style={st.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={st.saveBtn} onPress={handleUpdateStatus}><Text style={st.saveText}>Update</Text></TouchableOpacity>
            </View>
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
  dropActive: { fontSize: 14, color: C.primary, fontWeight: "700" },
  card: { backgroundColor: C.white, borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { fontSize: 14, fontWeight: "700", color: C.indigo },
  orderEmail: { fontSize: 13, color: C.light, marginTop: 2 },
  orderDate: { fontSize: 12, color: C.light, marginTop: 2 },
  orderTotal: { fontSize: 15, fontWeight: "700", color: C.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: "600" },
  actions: { flexDirection: "row", marginTop: 10, gap: 8 },
  viewBtn: { flex: 1, backgroundColor: "#EFF6FF", paddingVertical: 8, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  viewText: { color: C.blue, fontWeight: "600", fontSize: 13 },
  editBtn: { flex: 1, backgroundColor: "#D1FAE5", paddingVertical: 8, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  editText: { color: C.green, fontWeight: "600", fontSize: 13 },
  delBtn: { backgroundColor: "#FEF2F2", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, alignItems: "center" },
  delText: { color: C.red, fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", padding: 40, color: C.light, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  modalContent: { backgroundColor: C.white, borderRadius: 12, padding: 20, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 12 },
  detailLabel: { fontSize: 12, fontWeight: "600", color: C.light, marginTop: 8 },
  detailValue: { fontSize: 14, color: C.text, marginTop: 2 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTopWidth: 2, borderTopColor: C.border },
  totalLabel: { fontSize: 16, fontWeight: "700", color: C.text },
  totalValue: { fontSize: 18, fontWeight: "700", color: C.indigo },
  closeBtn: { backgroundColor: C.border, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 16 },
  closeText: { color: C.text, fontWeight: "600" },
  statusOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: "#F3F4F6", marginBottom: 8 },
  statusOptionActive: { backgroundColor: C.primary },
  statusOptionText: { fontSize: 14, color: C.text, fontWeight: "500" },
  statusOptionTextActive: { color: C.white, fontWeight: "700" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  cancelText: { color: C.text, fontWeight: "600" },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: C.primary },
  saveText: { color: C.white, fontWeight: "700" },
});
