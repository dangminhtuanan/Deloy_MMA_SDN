import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, RefreshControl,
} from "react-native";
import { categoryAPI } from "../../api/index";
import { FontAwesome5 } from "@expo/vector-icons";

const C = {
  primary: "#1e1b6e",
  bg: "#F5F5F5", white: "#FFF", text: "#333", light: "#666", border: "#E8E8E8", blue: "#3b82f6", red: "#ef4444", indigo: "#6366f1" };

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try { setLoading(true); const r = await categoryAPI.getAll(); setCategories(r.data || r || []); }
    catch { Alert.alert("Error", "Failed to load categories"); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { const r = await categoryAPI.getAll(); setCategories(r.data || r || []); } catch {}
    finally { setRefreshing(false); }
  }, []);

  const openAdd = () => { setEditing(null); setFormName(""); setFormDesc(""); setShowModal(true); };
  const openEdit = (c: any) => { setEditing(c); setFormName(c.name); setFormDesc(c.description || ""); setShowModal(true); };

  const handleSubmit = async () => {
    if (!formName.trim()) { Alert.alert("Error", "Name is required"); return; }
    try {
      const data = { name: formName.trim(), description: formDesc.trim() };
      if (editing) { await categoryAPI.update(editing._id, data); Alert.alert("Success", "Category updated!"); }
      else { await categoryAPI.create(data); Alert.alert("Success", "Category added!"); }
      setShowModal(false); fetchCategories();
    } catch (e: any) { Alert.alert("Error", e.response?.data?.message || "Failed to save"); }
  };

  const handleDelete = (c: any) => {
    Alert.alert("Delete Category", `Delete "${c.name}"?`, [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await categoryAPI.delete(c._id); Alert.alert("Success", "Deleted!"); fetchCategories(); }
        catch (e: any) { Alert.alert("Error", e.response?.data?.message || "Failed"); }
      }},
    ]);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("vi-VN");

  const filtered = categories.filter(c =>
    !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderItem = ({ item }: any) => (
    <View style={s.card}>
      <Text style={s.catName}>{item.name}</Text>
      {item.description ? <Text style={s.catDesc} numberOfLines={2}>{item.description}</Text> : null}
      <View style={s.catDateRow}>
        <FontAwesome5 name="calendar-alt" size={11} color={C.light} />
        <Text style={s.catDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={[s.actionBtn, { borderColor: C.blue }]} onPress={() => openEdit(item)}>
          <FontAwesome5 name="edit" size={13} color={C.blue} />
          <Text style={[s.actionBtnText, { color: C.blue }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { borderColor: C.red }]} onPress={() => handleDelete(item)}>
          <FontAwesome5 name="trash-alt" size={13} color={C.red} />
          <Text style={[s.actionBtnText, { color: C.red }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.toolbar}>
        <View style={s.searchContainer}>
          <FontAwesome5 name="search" size={14} color="#999" style={s.searchIcon} />
          <TextInput style={s.search} placeholder="Search categories..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#999" />
        </View>
      </View>
      
      <View style={s.headerRow}>
        <Text style={s.headerTitle}>Category List</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <FontAwesome5 name="plus" size={12} color={C.white} />
          <Text style={s.addText}>Add Category</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList data={filtered} keyExtractor={i => i._id} renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={s.empty}>No categories found</Text>}
        />
      )}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{editing ? "Edit Category" : "Add Category"}</Text>
            <View style={s.field}><Text style={s.label}>Name *</Text>
              <TextInput style={s.input} value={formName} onChangeText={setFormName} />
            </View>
            <View style={s.field}><Text style={s.label}>Description</Text>
              <TextInput style={[s.input, { height: 80, textAlignVertical: "top" }]} value={formDesc} onChangeText={setFormDesc} multiline />
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSubmit}><Text style={s.saveText}>{editing ? "Update" : "Add"}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: { backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  addText: { color: C.white, fontWeight: "700", fontSize: 13 },
  card: { backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12, marginHorizontal: 12, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  catName: { fontSize: 17, fontWeight: "700", color: C.text },
  catDesc: { fontSize: 14, color: C.light, marginTop: 4, lineHeight: 18 },
  catDateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  catDate: { fontSize: 12, color: C.light },
  actions: { flexDirection: "row", marginTop: 14, gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", padding: 40, color: C.light, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: C.white, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: C.text },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 24 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  cancelText: { color: C.text, fontWeight: "600" },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: C.primary },
  saveText: { color: C.white, fontWeight: "700" },
});
