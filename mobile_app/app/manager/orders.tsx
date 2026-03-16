import { managerAPI, orderAPI } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  primary: "#0f766e",
  bg: "#F5F5F5",
  white: "#FFF",
  text: "#333",
  light: "#666",
  border: "#E8E8E8",
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#10b981",
  yellow: "#fbbf24",
  purple: "#8b5cf6",
};
const STATUS_COLORS: Record<string, string> = {
  pending: C.yellow,
  paid: C.blue,
  shipped: C.purple,
  shipping: C.purple,
  completed: C.green,
  cancelled: C.red,
};
const STATUS_BG: Record<string, string> = {
  pending: "#FEF3C7",
  paid: "#DBEAFE",
  shipped: "#EDE9FE",
  shipping: "#EDE9FE",
  completed: "#D1FAE5",
  cancelled: "#FEE2E2",
};
const STATUS_TEXT: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  shipping: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};
const FILTER_STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"];
const SORT_OPTIONS = [
  { label: "Default", value: "default" },
  { label: "Date Desc", value: "date-desc" },
  { label: "Date Asc", value: "date-asc" },
  { label: "Total Desc", value: "total-desc" },
  { label: "Total Asc", value: "total-asc" },
];

export default function ManagerOrders() {
  const router = useRouter();
  const {
    loading: authLoading,
    isAuthenticated,
    isManager,
    isAdmin,
  } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showFilterMenu, setShowFilterMenu] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || (!isManager?.() && !isAdmin?.())) {
      router.replace("/auth");
      return;
    }

    fetchOrders();
  }, [authLoading, isAuthenticated, isManager, isAdmin, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getOrders({ page: 1, limit: 100 });
      const list =
        response?.data?.orders ||
        response?.orders ||
        response?.data ||
        response ||
        [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await managerAPI.getOrders({ page: 1, limit: 100 });
      const list =
        response?.data?.orders ||
        response?.orders ||
        response?.data ||
        response ||
        [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price || 0);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const openDetail = async (order: any) => {
    try {
      const response = await orderAPI.getById(order._id);
      setSelectedOrder(response);
      setShowDetail(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load order details");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchTerm.toLowerCase();
    const customerName = [
      order.shippingAddress?.firstName,
      order.shippingAddress?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const userName = order.user?.username?.toLowerCase() || "";
    const email = order.email?.toLowerCase() || order.user?.email?.toLowerCase() || "";
    const orderId = order._id?.toLowerCase() || "";
    const matchesSearch =
      !query ||
      orderId.includes(query) ||
      userName.includes(query) ||
      email.includes(query) ||
      customerName.includes(query);
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "total-desc":
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      case "total-asc":
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      default:
        return 0;
    }
  });

  const renderOrder = ({ item }: any) => {
    const status = item.status || "pending";
    const customerName = [
      item.shippingAddress?.firstName,
      item.shippingAddress?.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>#{item._id?.slice(-8).toUpperCase()}</Text>
            <Text style={styles.orderUser}>
              {customerName || item.user?.username || item.email || "N/A"}
            </Text>
            <Text style={styles.orderDate}>
              <FontAwesome5
                name="calendar-alt"
                size={11}
                color={C.light}
              />{" "}
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.orderTotal}>{formatPrice(item.totalAmount)}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: STATUS_BG[status] || "#F3F4F6" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: STATUS_COLORS[status] || C.light },
                ]}
              >
                {STATUS_TEXT[status] || status}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.viewBtn} onPress={() => openDetail(item)}>
          <FontAwesome5
            name="eye"
            size={12}
            color={C.blue}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.viewText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <FontAwesome5
            name="search"
            size={14}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.search}
            placeholder="Search orders..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.chip}
          onPress={() =>
            setShowFilterMenu(showFilterMenu === "status" ? null : "status")
          }
        >
          <FontAwesome5
            name="clipboard-list"
            size={12}
            color={C.text}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.chipText}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() =>
            setShowFilterMenu(showFilterMenu === "sort" ? null : "sort")
          }
        >
          <FontAwesome5
            name="sort"
            size={12}
            color={C.text}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.chipText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {showFilterMenu === "status" && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropItem}
            onPress={() => {
              setStatusFilter("");
              setShowFilterMenu(null);
            }}
          >
            <Text style={!statusFilter ? styles.dropActive : styles.dropText}>
              All
            </Text>
          </TouchableOpacity>
          {FILTER_STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={styles.dropItem}
              onPress={() => {
                setStatusFilter(status);
                setShowFilterMenu(null);
              }}
            >
              <Text
                style={
                  statusFilter === status ? styles.dropActive : styles.dropText
                }
              >
                {STATUS_TEXT[status]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showFilterMenu === "sort" && (
        <View style={styles.dropdown}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.dropItem}
              onPress={() => {
                setSortBy(option.value);
                setShowFilterMenu(null);
              }}
            >
              <Text
                style={
                  sortBy === option.value ? styles.dropActive : styles.dropText
                }
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={sortedOrders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No orders found</Text>}
      />

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Order Detail</Text>
              {selectedOrder && (
                <>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>
                    #{(selectedOrder.order?._id || selectedOrder._id)?.slice(-8).toUpperCase()}
                  </Text>

                  <Text style={styles.detailLabel}>Customer</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.order?.user?.username ||
                      selectedOrder.order?.email ||
                      "N/A"}
                  </Text>

                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(
                      selectedOrder.order?.createdAt || selectedOrder.createdAt,
                    )}
                  </Text>

                  <Text style={styles.detailLabel}>Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          STATUS_BG[selectedOrder.order?.status || selectedOrder.status] ||
                          "#F3F4F6",
                        alignSelf: "flex-start",
                        marginBottom: 8,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            STATUS_COLORS[selectedOrder.order?.status || selectedOrder.status] ||
                            C.light,
                        },
                      ]}
                    >
                      {STATUS_TEXT[selectedOrder.order?.status || selectedOrder.status] ||
                        selectedOrder.order?.status ||
                        selectedOrder.status}
                    </Text>
                  </View>

                  <Text style={styles.detailLabel}>Shipping Address</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.order?.shippingAddress
                      ? typeof selectedOrder.order.shippingAddress === "string"
                        ? selectedOrder.order.shippingAddress
                        : `${selectedOrder.order.shippingAddress.firstName || ""} ${selectedOrder.order.shippingAddress.lastName || ""}, ${selectedOrder.order.shippingAddress.phone || ""}, ${selectedOrder.order.shippingAddress.address || ""}`
                      : "N/A"}
                  </Text>

                  <Text style={[styles.detailLabel, { marginTop: 16 }]}>
                    Items
                  </Text>
                  {(selectedOrder.items || []).map((item: any, index: number) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={{ flex: 1, fontSize: 13, color: C.text }}>
                        {item.product?.name || "N/A"}
                      </Text>
                      <Text style={{ fontSize: 13, color: C.light }}>
                        x{item.quantity}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: C.text,
                          marginLeft: 8,
                        }}
                      >
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      {formatPrice(
                        selectedOrder.order?.totalAmount ||
                          selectedOrder.totalAmount ||
                          0,
                      )}
                    </Text>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowDetail(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  toolbar: { padding: 12, paddingBottom: 0 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 8, fontSize: 14, color: C.text },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: C.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
  },
  chipText: { fontSize: 13, color: C.text },
  dropdown: {
    backgroundColor: C.white,
    marginHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 4,
  },
  dropItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropText: { fontSize: 14, color: C.text },
  dropActive: { fontSize: 14, color: C.primary, fontWeight: "700" },
  card: {
    backgroundColor: C.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { fontSize: 14, fontWeight: "700", color: C.primary },
  orderUser: { fontSize: 13, color: C.light, marginTop: 2 },
  orderDate: { fontSize: 12, color: C.light, marginTop: 2 },
  orderTotal: { fontSize: 15, fontWeight: "700", color: C.text },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  viewBtn: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  viewText: { color: C.blue, fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", padding: 40, color: C.light, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 12 },
  detailLabel: { fontSize: 12, fontWeight: "600", color: C.light, marginTop: 8 },
  detailValue: { fontSize: 14, color: C.text, marginTop: 2 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: C.border,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: C.text },
  totalValue: { fontSize: 18, fontWeight: "700", color: C.primary },
  closeBtn: {
    backgroundColor: C.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  closeText: { color: C.text, fontWeight: "600" },
});
