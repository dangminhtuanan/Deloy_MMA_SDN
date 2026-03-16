import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, RefreshControl,
} from "react-native";
import { userAPI, roleAPI } from "../../api/index";
import { FontAwesome5 } from "@expo/vector-icons";

const COLORS = { primary: "#1e1b6e", bg: "#F5F5F5", white: "#FFF", text: "#333", light: "#666", border: "#E8E8E8", blue: "#3b82f6", red: "#ef4444", indigo: "#6366f1" };

const ROLES = ["user", "staff", "manager", "admin"];
const SORT_OPTIONS = [
  { label: "Default", value: "default" },
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Email A-Z", value: "email-asc" },
  { label: "Newest", value: "date-desc" },
  { label: "Oldest", value: "date-asc" },
];

const getRoleStyle = (role: string) => {
  const r = (role || "").toLowerCase();
  if (r === "admin") return { bg: "#DBEAFE", text: "#1E40AF" };
  if (r === "manager") return { bg: "#F3E8FF", text: "#6B21A8" };
  if (r === "staff") return { bg: "#FFEDD5", text: "#9A3412" };
  return { bg: "#F3F4F6", text: "#374151" };
};

const emptyForm = { username: "", name: "", email: "", password: "", phone: "", address: "", role: "" };

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { setLoading(true); const r = await userAPI.getAll(); setUsers(r.data || r); }
    catch (e) { console.error(e); Alert.alert("Error", "Failed to load users"); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { const r = await userAPI.getAll(); setUsers(r.data || r); } catch {}
    finally { setRefreshing(false); }
  }, []);

  const getRoleName = (u: any) => {
    if (u.roles?.length > 0) return u.roles.map((r: any) => r.name).join(", ");
    if (u.role) return u.role.charAt(0).toUpperCase() + u.role.slice(1);
    return "User";
  };

  const openAdd = () => { setEditingUser(null); setFormData(emptyForm); setShowModal(true); };
  const openEdit = (u: any) => {
    setEditingUser(u);
    let role = "";
    if (u.role) role = u.role.toLowerCase();
    else if (u.roles?.length > 0) role = u.roles[0].name.toLowerCase();
    setFormData({ username: u.username || "", name: u.name || "", email: u.email || "", password: "", phone: u.phone || "", address: u.address || "", role });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.name || !formData.email) { Alert.alert("Error", "Please fill required fields"); return; }
    if (!editingUser && !formData.password) { Alert.alert("Error", "Password required"); return; }
    try {
      const data: any = { username: formData.username, name: formData.name, email: formData.email, phone: formData.phone, address: formData.address, role: formData.role || "user" };
      if (formData.password) data.password = formData.password;
      if (editingUser) { await userAPI.update(editingUser._id, data); Alert.alert("Success", "User updated!"); }
      else { await userAPI.create(data); Alert.alert("Success", "User created!"); }
      setShowModal(false); fetchUsers();
    } catch (e: any) { Alert.alert("Error", e.response?.data?.message || "Failed to save"); }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm Delete", "Delete this user?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await userAPI.delete(id); Alert.alert("Success", "User deleted!"); fetchUsers(); }
        catch (e: any) { Alert.alert("Error", e.response?.data?.message || "Failed to delete"); }
      }},
    ]);
  };

  const filtered = users.filter(u => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s || u.username?.toLowerCase().includes(s) || u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
    const uRole = u.role || (u.roles?.length > 0 ? u.roles[0].name.toLowerCase() : "user");
    const matchRole = !roleFilter || uRole.toLowerCase() === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "name-asc": return (a.name || "").localeCompare(b.name || "");
      case "name-desc": return (b.name || "").localeCompare(a.name || "");
      case "email-asc": return (a.email || "").localeCompare(b.email || "");
      case "email-desc": return (b.email || "").localeCompare(a.email || "");
      case "date-asc": return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case "date-desc": return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      default: return 0;
    }
  });

  const renderUser = ({ item }: any) => {
    const role = item.role || (item.roles?.length > 0 ? item.roles[0].name.toLowerCase() : "user");
    const rStyle = getRoleStyle(role);
    
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={s.userName}>{item.name || item.username}</Text>
              <View style={[s.roleBadge, { backgroundColor: rStyle.bg }]}>
                <Text style={[s.roleText, { color: rStyle.text }]}>{getRoleName(item)}</Text>
              </View>
            </View>
            <Text style={s.userEmail}>{item.email}</Text>
            <View style={s.userMetaRow}>
              {item.phone ? <Text style={s.userMeta}>📞 {item.phone}</Text> : null}
              <Text style={s.userMeta}>📅 Joined: {new Date(item.createdAt).toLocaleDateString("vi-VN")}</Text>
            </View>
            <View style={s.statusBadge}>
              <View style={[s.statusDot, { backgroundColor: item.isActive !== false ? "#10b981" : "#ef4444" }]} />
              <Text style={s.statusText}>{item.isActive !== false ? "Active" : "Inactive"}</Text>
            </View>
          </View>
        </View>
        <View style={s.actions}>
          <TouchableOpacity style={[s.actionBtn, { borderColor: COLORS.blue }]} onPress={() => openEdit(item)}>
            <FontAwesome5 name="edit" size={14} color={COLORS.blue} />
            <Text style={[s.actionBtnText, { color: COLORS.blue }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { borderColor: COLORS.red }]} onPress={() => handleDelete(item._id)}>
            <FontAwesome5 name="trash-alt" size={14} color={COLORS.red} />
            <Text style={[s.actionBtnText, { color: COLORS.red }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Search + Filter bar */}
      <View style={s.toolbar}>
        <View style={s.searchContainer}>
          <FontAwesome5 name="search" size={14} color="#999" style={s.searchIcon} />
          <TextInput style={s.search} placeholder="Search users..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#999" />
        </View>
        <TouchableOpacity style={s.filterBtn} onPress={() => setShowFilterMenu(!showFilterMenu)}>
          <FontAwesome5 name="filter" size={12} color={COLORS.text} style={{ marginRight: 4 }} />
          <Text style={s.filterBtnText}>Role</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.filterBtn} onPress={() => setShowSortMenu(!showSortMenu)}>
          <FontAwesome5 name="sort" size={12} color={COLORS.text} style={{ marginRight: 4 }} />
          <Text style={s.filterBtnText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {showFilterMenu && (
        <View style={s.dropdown}>
          <TouchableOpacity style={s.dropItem} onPress={() => { setRoleFilter(""); setShowFilterMenu(false); }}><Text style={roleFilter === "" ? s.dropActive : s.dropText}>All Roles</Text></TouchableOpacity>
          {ROLES.map(r => (
            <TouchableOpacity key={r} style={s.dropItem} onPress={() => { setRoleFilter(r); setShowFilterMenu(false); }}>
              <Text style={roleFilter === r ? s.dropActive : s.dropText}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showSortMenu && (
        <View style={s.dropdown}>
          {SORT_OPTIONS.map(o => (
            <TouchableOpacity key={o.value} style={s.dropItem} onPress={() => { setSortBy(o.value); setShowSortMenu(false); }}>
              <Text style={sortBy === o.value ? s.dropActive : s.dropText}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Add button */}
      <TouchableOpacity style={s.addBtn} onPress={openAdd}>
        <FontAwesome5 name="user-plus" size={14} color={COLORS.white} />
        <Text style={s.addText}>Add User</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={sorted} keyExtractor={i => i._id} renderItem={renderUser}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={s.empty}>No users found</Text>}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <ScrollView>
              <Text style={s.modalTitle}>{editingUser ? "Edit User" : "Add User"}</Text>
              {[
                { label: "Username *", key: "username", kb: "default" as const },
                { label: "Name *", key: "name", kb: "default" as const },
                { label: "Email *", key: "email", kb: "email-address" as const },
                { label: editingUser ? "Password (leave blank)" : "Password *", key: "password", kb: "default" as const, secure: true },
                { label: "Phone", key: "phone", kb: "phone-pad" as const },
                { label: "Address", key: "address", kb: "default" as const },
              ].map(f => (
                <View key={f.key} style={s.field}>
                  <Text style={s.label}>{f.label}</Text>
                  <TextInput style={s.input} value={(formData as any)[f.key]} onChangeText={v => setFormData(p => ({ ...p, [f.key]: v }))}
                    keyboardType={f.kb} secureTextEntry={f.secure} autoCapitalize="none" placeholderTextColor="#999" />
                </View>
              ))}
              <View style={s.field}>
                <Text style={s.label}>Role</Text>
                <View style={s.roleRow}>
                  {ROLES.map(r => (
                    <TouchableOpacity key={r} style={[s.roleOption, formData.role === r && s.roleSelected]} onPress={() => setFormData(p => ({ ...p, role: r }))}>
                      <Text style={[s.roleOptionText, formData.role === r && s.roleSelectedText]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSubmit}><Text style={s.saveText}>{editingUser ? "Update" : "Add"}</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  toolbar: { flexDirection: "row", padding: 12, gap: 8 },
  searchContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 10 },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 8, fontSize: 14, color: COLORS.text },
  filterBtn: { backgroundColor: COLORS.white, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  filterBtnText: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  dropdown: { backgroundColor: COLORS.white, marginHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  dropItem: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropText: { fontSize: 14, color: COLORS.text },
  dropActive: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  addBtn: { backgroundColor: COLORS.primary, marginHorizontal: 12, paddingVertical: 12, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 },
  addText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  userName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  userEmail: { fontSize: 13, color: COLORS.light, marginTop: 2 },
  userMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  userMeta: { fontSize: 12, color: COLORS.light },
  statusBadge: { flexDirection: "row", alignItems: "center", marginTop: 6, backgroundColor: "#F3F4F6", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, color: COLORS.text, fontWeight: "500" },
  roleBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  roleText: { fontSize: 10, fontWeight: "700" },
  actions: { flexDirection: "row", marginTop: 12, gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", padding: 40, color: COLORS.light, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F3F4F6" },
  roleSelected: { backgroundColor: COLORS.primary },
  roleOptionText: { fontSize: 13, fontWeight: "500", color: COLORS.text },
  roleSelectedText: { color: COLORS.white },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.text, fontWeight: "600" },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.primary },
  saveText: { color: COLORS.white, fontWeight: "700" },
});
