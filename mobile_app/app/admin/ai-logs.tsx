import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { aiBehaviorLogAPI } from "../../api/index";
import { FontAwesome5 } from "@expo/vector-icons";

const C = {
  primary: "#1e1b6e",
  bg: "#F5F5F5", white: "#FFF", text: "#333", light: "#666", border: "#E8E8E8", blue: "#3b82f6", red: "#ef4444", indigo: "#6366f1" };
const FLOWS = ["chatbot", "recommendation", "other"];

export default function AILogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [flowFilter, setFlowFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  const buildParams = (overrides: any = {}) => {
    const p: any = { flow: flowFilter, action: actionFilter, limit: 50, ...overrides };
    Object.keys(p).forEach(k => { if (!p[k]) delete p[k]; });
    return p;
  };

  const fetchLogs = async (overrides: any = {}) => {
    try {
      setLoading(true);
      const r = await aiBehaviorLogAPI.getAll(buildParams(overrides));
      const payload = r?.data ?? r;
      const data = Array.isArray(payload) ? payload : payload?.data;
      setLogs(Array.isArray(data) ? data : []);
    } catch { Alert.alert("Error", "Failed to load AI logs"); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await aiBehaviorLogAPI.getAll(buildParams());
      const payload = r?.data ?? r;
      const data = Array.isArray(payload) ? payload : payload?.data;
      setLogs(Array.isArray(data) ? data : []);
    } catch {}
    finally { setRefreshing(false); }
  }, [flowFilter, actionFilter]);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Log", "Delete this log entry?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await aiBehaviorLogAPI.delete(id); Alert.alert("Success", "Deleted!"); fetchLogs(); }
        catch { Alert.alert("Error", "Failed to delete"); }
      }},
    ]);
  };

  const handleClear = () => {
    setFlowFilter(""); setActionFilter(""); setSearchTerm("");
    fetchLogs({ flow: "", action: "", limit: 50 });
  };

  const formatDT = (v: string) => { try { return new Date(v).toLocaleString("vi-VN"); } catch { return v || "-"; } };
  const resolveUser = (v: any) => { if (!v) return "-"; if (typeof v === "string") return v; return v?._id || v?.id || "-"; };
  const fmtMeta = (m: any) => { if (!m) return "-"; try { return JSON.stringify(m); } catch { return String(m); } };

  const filtered = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const kw = searchTerm.toLowerCase();
    return (
      String(log.message || "").toLowerCase().includes(kw) ||
      String(log.action || "").toLowerCase().includes(kw) ||
      String(log.flow || "").toLowerCase().includes(kw) ||
      String(resolveUser(log.user)).toLowerCase().includes(kw)
    );
  });

  const renderLog = ({ item }: any) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.logTime}>{formatDT(item.createdAt)}</Text>
          <Text style={s.logUser}><FontAwesome5 name="user" size={12} color={C.light} /> {resolveUser(item.user)}</Text>
        </View>
        <View style={s.flowBadge}><Text style={s.flowText}>{item.flow || "-"}</Text></View>
      </View>
      <View style={s.cardBody}>
        <Text style={s.logField}>Action: <Text style={s.logValue}>{item.action || "-"}</Text></Text>
        {item.message ? <Text style={s.logField} numberOfLines={2}>Message: <Text style={s.logValue}>{item.message}</Text></Text> : null}
        {item.productIds?.length > 0 && (
          <Text style={s.logField}>Products: <Text style={s.logValue}>{item.productIds.slice(0, 3).join(", ")}{item.productIds.length > 3 ? ` +${item.productIds.length - 3}` : ""}</Text></Text>
        )}
        {item.metadata && <Text style={s.logField} numberOfLines={1}>Metadata: <Text style={s.logValue}>{fmtMeta(item.metadata)}</Text></Text>}
      </View>
      <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item._id)}>
        <FontAwesome5 name="trash-alt" size={13} color={C.red} style={{ marginRight: 6 }} />
        <Text style={s.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.listHeader}>
        <Text style={s.listTitle}>Behavior Log List</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={() => fetchLogs()}>
          <FontAwesome5 name="sync-alt" size={14} color={C.primary} />
        </TouchableOpacity>
      </View>

      <View style={s.toolbar}>
        <View style={s.searchContainer}>
          <FontAwesome5 name="search" size={14} color="#999" style={s.searchIcon} />
          <TextInput style={s.search} placeholder="Search logs..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#999" />
        </View>
        <TouchableOpacity style={s.filterToggle} onPress={() => setShowFilters(!showFilters)}>
          <FontAwesome5 name="sliders-h" size={14} color={C.text} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 13 }}>Filters</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={s.filterPanel}>
          <Text style={s.filterLabel}>Flow</Text>
          <View style={s.chipRow}>
            <TouchableOpacity style={[s.chip, !flowFilter && s.chipActive]} onPress={() => setFlowFilter("")}><Text style={!flowFilter ? s.chipActiveText : s.chipText}>All</Text></TouchableOpacity>
            {FLOWS.map(f => (
              <TouchableOpacity key={f} style={[s.chip, flowFilter === f && s.chipActive]} onPress={() => setFlowFilter(f)}>
                <Text style={flowFilter === f ? s.chipActiveText : s.chipText}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.filterLabel}>Action</Text>
          <TextInput style={s.input} value={actionFilter} onChangeText={setActionFilter} placeholder="Filter by action..." placeholderTextColor="#999" />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={s.applyBtn} onPress={() => fetchLogs()}><Text style={s.applyText}>Apply</Text></TouchableOpacity>
            <TouchableOpacity style={s.clearBtn} onPress={handleClear}><Text style={s.clearText}>Clear</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList data={filtered} keyExtractor={(i, idx) => i._id || String(idx)} renderItem={renderLog}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={s.empty}>No logs found</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  toolbar: { flexDirection: "row", padding: 12, gap: 8, paddingTop: 4 },
  searchContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 8, fontSize: 14, color: C.text },
  filterToggle: { backgroundColor: C.white, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  listTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  refreshBtn: { padding: 8, borderRadius: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  filterPanel: { backgroundColor: C.white, marginHorizontal: 12, borderRadius: 8, padding: 14, marginBottom: 8, elevation: 1 },
  filterLabel: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 6, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: "#F3F4F6" },
  chipActive: { backgroundColor: C.primary },
  chipText: { fontSize: 13, color: C.text },
  chipActiveText: { fontSize: 13, color: C.white, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, marginTop: 4 },
  applyBtn: { flex: 1, backgroundColor: C.primary, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  applyText: { color: C.white, fontWeight: "700" },
  clearBtn: { flex: 1, borderWidth: 1, borderColor: C.border, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  clearText: { color: C.text, fontWeight: "600" },
  card: { backgroundColor: C.white, borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logTime: { fontSize: 12, color: C.light },
  logUser: { fontSize: 13, fontWeight: "600", color: C.text, marginTop: 2 },
  flowBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  flowText: { fontSize: 11, fontWeight: "600", color: C.indigo },
  cardBody: { marginTop: 8 },
  logField: { fontSize: 12, color: C.light, marginTop: 4 },
  logValue: { color: C.text },
  deleteBtn: { marginTop: 10, backgroundColor: "#FEF2F2", paddingVertical: 8, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  deleteText: { color: C.red, fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", padding: 40, color: C.light, fontSize: 14 },
});
