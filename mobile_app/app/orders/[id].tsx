import { orderAPI } from "@/api";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(price || 0);

const statusMap: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    order: any | null;
    items: any[];
  }>({
    loading: true,
    error: null,
    order: null,
    items: [],
  });

  useEffect(() => {
    if (!id) {
      setState({
        loading: false,
        error: "Missing order id.",
        order: null,
        items: [],
      });
      return;
    }

    let active = true;

    orderAPI
      .getById(id)
      .then((data) => {
        if (!active) return;
        setState({
          loading: false,
          error: null,
          order: data?.order || null,
          items: Array.isArray(data?.items) ? data.items : [],
        });
      })
      .catch((error: any) => {
        if (!active) return;
        setState({
          loading: false,
          error:
            error?.response?.data?.message || "Unable to load order details.",
          order: null,
          items: [],
        });
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.error || !state.order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color="#9ca3af" />
          <Text style={styles.errorText}>
            {state.error || "Order not found."}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/")}
            activeOpacity={0.85}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel = statusMap[state.order.status] || state.order.status;
  const shippingAddress = state.order.shippingAddress || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            activeOpacity={0.85}
          >
            <Feather name="arrow-left" size={18} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.code}>{state.order._id}</Text>

          <View style={styles.row}>
            <Text style={styles.metaLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.metaLabel}>Payment</Text>
            <Text style={styles.metaValue}>
              {(state.order.paymentMethod || "N/A").toUpperCase()}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.metaLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatPrice(state.order.totalAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {state.items.map((item) => (
            <View key={item._id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product?.name || "Product"}
                </Text>
                <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <Text style={styles.addressLine}>
            {[shippingAddress.firstName, shippingAddress.lastName]
              .filter(Boolean)
              .join(" ")}
          </Text>
          <Text style={styles.addressLine}>{shippingAddress.phone || ""}</Text>
          <Text style={styles.addressLine}>{shippingAddress.address || ""}</Text>
          <Text style={styles.addressLine}>
            {[shippingAddress.district, shippingAddress.city]
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: "#4b5563",
  },
  errorText: {
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
  },
  backButton: {
    marginTop: 8,
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  iconSpacer: {
    width: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    padding: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  code: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  metaLabel: {
    fontSize: 14,
    color: "#4b5563",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: "#111827",
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  itemMeta: {
    fontSize: 13,
    color: "#6b7280",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  addressLine: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
});
