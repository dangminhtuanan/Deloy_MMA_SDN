import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { staffAPI } from "../../api/index";
import { FontAwesome5 } from "@expo/vector-icons";

const TEAL = "#0f766e";
const C = { primary: TEAL, bg: "#F5F5F5", white: "#FFF", text: "#333", light: "#666", border: "#E8E8E8", red: "#ef4444", yellow: "#f59e0b", green: "#10b981" };

export default function LowStock() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchLowStock(); }, []);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const r = await staffAPI.getLowStock();
      setProducts(r.data || r || []);
    } catch { Alert.alert("Error", "Failed to load low stock products"); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { const r = await staffAPI.getLowStock(); setProducts(r.data || r || []); } catch {}
    finally { setRefreshing(false); }
  }, []);

  const formatPrice = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(p);

  const getStockColor = (stock: number) => {
    if (stock === 0) return C.red;
    if (stock <= 5) return C.red;
    return C.yellow;
  };

  const filtered = products.filter(p =>
    !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderItem = ({ item }: any) => {
    const stockColor = getStockColor(item.stock);
    return (
      <View style={[s.card, { borderLeftColor: stockColor }]}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.prodName} numberOfLines={1}>{item.name}</Text>
            <View style={s.metaRow}>
              <FontAwesome5 name="tag" size={11} color={C.light} />
              <Text style={s.metaTxt}>{item.category?.name || "N/A"}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <Text style={s.price}>{formatPrice(item.price)}</Text>
            <View style={[s.stockBadge, { backgroundColor: stockColor + "20", borderColor: stockColor }]}>
              <FontAwesome5 name="box" size={10} color={stockColor} style={{ marginRight: 4 }} />
              <Text style={[s.stockTxt, { color: stockColor }]}>
                {item.stock === 0 ? "Out of Stock" : `Stock: ${item.stock}`}
              </Text>
            </View>
          </View>
        </View>
        {item.stock === 0 && (
          <View style={s.alertRow}>
            <FontAwesome5 name="exclamation-circle" size={12} color={C.red} />
            <Text style={s.alertTxt}>This product is out of stock</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.toolbar}>
        <View style={s.searchContainer}>
          <FontAwesome5 name="search" size={14} color="#999" style={s.searchIcon} />
          <TextInput style={s.search} placeholder="Search products..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#999" />
        </View>
      </View>

      <View style={s.headerRow}>
        <Text style={s.headerTitle}>Low Stock Products</Text>
        <View style={s.countBadge}>
          <Text style={s.countTxt}>{filtered.length} items</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: C.red }]} />
          <Text style={s.legendTxt}>Out / Critical (≤5)</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: C.yellow }]} />
          <Text style={s.legendTxt}>Low (≤10)</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <FontAwesome5 name="check-circle" size={48} color={C.green} />
              <Text style={s.emptyTitle}>All Good!</Text>
              <Text style={s.emptyTxt}>No low stock products found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  toolbar: { padding: 12, paddingBottom: 0 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.text },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  countBadge: { backgroundColor: TEAL + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countTxt: { fontSize: 12, color: TEAL, fontWeight: "700" },
  legend: { flexDirection: "row", paddingHorizontal: 12, gap: 16, marginBottom: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { fontSize: 12, color: C.light },
  card: { backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 10, marginHorizontal: 12, borderLeftWidth: 4, elevation: 1 },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  prodName: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaTxt: { fontSize: 13, color: C.light },
  price: { fontSize: 14, fontWeight: "700", color: TEAL },
  stockBadge: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  stockTxt: { fontSize: 12, fontWeight: "700" },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  alertTxt: { fontSize: 12, color: C.red, fontWeight: "600" },
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  emptyTxt: { fontSize: 14, color: C.light },
});
