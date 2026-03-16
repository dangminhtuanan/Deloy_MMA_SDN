import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, RefreshControl, Image,
} from "react-native";
import { productAPI, categoryAPI } from "../../api/index";
import { FontAwesome5 } from "@expo/vector-icons";

const COLORS = { primary: "#1e1b6e", bg: "#F5F5F5", white: "#FFF", text: "#333", light: "#666", border: "#E8E8E8", blue: "#3b82f6", red: "#ef4444", indigo: "#6366f1", green: "#10b981" };

const PRICE_FILTERS = [
  { label: "All Prices", value: "all" }, { label: "< 300K", value: "0-300" },
  { label: "300K-500K", value: "300-500" }, { label: "500K-1M", value: "500-1000" },
  { label: "> 1M", value: "1000+" },
];
const SORT_OPTIONS = [
  { label: "Default", value: "default" }, { label: "Price ↑", value: "price-asc" },
  { label: "Price ↓", value: "price-desc" }, { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" }, { label: "Stock ↑", value: "stock-asc" },
  { label: "Stock ↓", value: "stock-desc" },
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const emptyForm = { name: "", description: "", price: "", category: "", stock: "", images: [""], size: [] as string[] };

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [showFilterMenu, setShowFilterMenu] = useState<string | null>(null);

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const fetchProducts = async () => {
    try { setLoading(true); const r = await productAPI.getAll(); setProducts(r.data || r); }
    catch { Alert.alert("Error", "Failed to load products"); }
    finally { setLoading(false); }
  };
  const fetchCategories = async () => {
    try { const r = await categoryAPI.getAll(); setCategories(r.data || r); } catch {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { const r = await productAPI.getAll(); setProducts(r.data || r); } catch {}
    finally { setRefreshing(false); }
  }, []);

  const formatPrice = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(p);

  const openAdd = () => { setEditingProduct(null); setFormData(emptyForm); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name, description: p.description || "", price: p.price.toString(),
      category: p.category?._id || p.category || "", stock: p.stock.toString(),
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [""],
      size: Array.isArray(p.size) ? p.size : (p.size ? p.size.split(",").map((s: string) => s.trim()) : []),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { Alert.alert("Error", "Product name required"); return; }
    if (!formData.price || parseFloat(formData.price) <= 0) { Alert.alert("Error", "Valid price required"); return; }
    if (!formData.category) { Alert.alert("Error", "Select a category"); return; }
    try {
      const data = { ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock) || 0, images: formData.images.filter(i => i.trim()), size: formData.size };
      if (editingProduct) { await productAPI.update(editingProduct._id, data); Alert.alert("Success", "Product updated!"); }
      else { await productAPI.create(data); Alert.alert("Success", "Product added!"); }
      setShowModal(false); fetchProducts();
    } catch (e: any) { Alert.alert("Error", e.response?.data?.message || "Failed to save"); }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm", "Delete this product?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await productAPI.delete(id); Alert.alert("Success", "Deleted!"); fetchProducts(); }
        catch { Alert.alert("Error", "Failed to delete"); }
      }},
    ]);
  };

  const handleSizeToggle = (size: string) => {
    setFormData(p => ({ ...p, size: p.size.includes(size) ? p.size.filter(s => s !== size) : [...p.size, size] }));
  };

  const handleImageChange = (index: number, value: string) => {
    const imgs = [...formData.images]; imgs[index] = value;
    setFormData(p => ({ ...p, images: imgs }));
  };

  const filtered = products.filter(p => {
    const matchSearch = !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const pCat = p.category?._id || p.category;
    const matchCat = !categoryFilter || pCat === categoryFilter;
    let matchPrice = true;
    if (priceFilter !== "all") {
      const price = p.price;
      if (priceFilter === "0-300") matchPrice = price < 300000;
      else if (priceFilter === "300-500") matchPrice = price >= 300000 && price < 500000;
      else if (priceFilter === "500-1000") matchPrice = price >= 500000 && price < 1000000;
      else if (priceFilter === "1000+") matchPrice = price >= 1000000;
    }
    return matchSearch && matchCat && matchPrice;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      case "stock-asc": return a.stock - b.stock;
      case "stock-desc": return b.stock - a.stock;
      default: return 0;
    }
  });

  const renderProduct = ({ item }: any) => (
    <View style={st.card}>
      <View style={st.cardRow}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={st.thumb} />
        ) : (
          <View style={[st.thumb, { backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" }]}>
            <FontAwesome5 name="image" size={24} color="#ccc" />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={st.prodName} numberOfLines={1}>{item.name}</Text>
          <Text style={st.prodPrice}>{formatPrice(item.price)}</Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            <View style={st.metaItem}>
              <FontAwesome5 name="box" size={10} color={COLORS.light} />
              <Text style={st.prodMeta}>{item.stock}</Text>
            </View>
            <View style={st.metaItem}>
              <FontAwesome5 name="tag" size={10} color={COLORS.light} />
              <Text style={st.prodMeta}>{item.category?.name || "N/A"}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={st.actions}>
        <TouchableOpacity style={[st.actionBtn, { borderColor: COLORS.blue }]} onPress={() => openEdit(item)}>
          <FontAwesome5 name="edit" size={13} color={COLORS.blue} />
          <Text style={[st.actionBtnText, { color: COLORS.blue }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.actionBtn, { borderColor: COLORS.red }]} onPress={() => handleDelete(item._id)}>
          <FontAwesome5 name="trash-alt" size={13} color={COLORS.red} />
          <Text style={[st.actionBtnText, { color: COLORS.red }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={st.container}>
      <View style={st.toolbar}>
        <View style={st.searchContainer}>
          <FontAwesome5 name="search" size={14} color="#999" style={st.searchIcon} />
          <TextInput style={st.search} placeholder="Search products..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#999" />
        </View>
      </View>
      
      <View style={st.filterRow}>
        <TouchableOpacity style={st.chip} onPress={() => setShowFilterMenu(showFilterMenu === "price" ? null : "price")}>
          <FontAwesome5 name="dollar-sign" size={11} color={COLORS.text} style={{ marginRight: 6 }} />
          <Text style={st.chipText}>Price</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.chip} onPress={() => setShowFilterMenu(showFilterMenu === "cat" ? null : "cat")}>
          <FontAwesome5 name="tag" size={11} color={COLORS.text} style={{ marginRight: 6 }} />
          <Text style={st.chipText}>Category</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.chip} onPress={() => setShowFilterMenu(showFilterMenu === "sort" ? null : "sort")}>
          <FontAwesome5 name="sort" size={11} color={COLORS.text} style={{ marginRight: 6 }} />
          <Text style={st.chipText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {showFilterMenu === "price" && (
        <View style={st.dropdown}>{PRICE_FILTERS.map(o => (
          <TouchableOpacity key={o.value} style={st.dropItem} onPress={() => { setPriceFilter(o.value); setShowFilterMenu(null); }}>
            <Text style={priceFilter === o.value ? st.dropActive : st.dropText}>{o.label}</Text>
          </TouchableOpacity>
        ))}</View>
      )}
      {showFilterMenu === "cat" && (
        <View style={st.dropdown}>
          <TouchableOpacity style={st.dropItem} onPress={() => { setCategoryFilter(""); setShowFilterMenu(null); }}><Text style={!categoryFilter ? st.dropActive : st.dropText}>All Categories</Text></TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity key={c._id} style={st.dropItem} onPress={() => { setCategoryFilter(c._id); setShowFilterMenu(null); }}>
              <Text style={categoryFilter === c._id ? st.dropActive : st.dropText}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showFilterMenu === "sort" && (
        <View style={st.dropdown}>{SORT_OPTIONS.map(o => (
          <TouchableOpacity key={o.value} style={st.dropItem} onPress={() => { setSortBy(o.value); setShowFilterMenu(null); }}>
            <Text style={sortBy === o.value ? st.dropActive : st.dropText}>{o.label}</Text>
          </TouchableOpacity>
        ))}</View>
      )}

      <TouchableOpacity style={st.addBtn} onPress={openAdd}>
        <FontAwesome5 name="plus" size={12} color={COLORS.white} />
        <Text style={st.addText}>Add Product</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList data={sorted} keyExtractor={i => i._id} renderItem={renderProduct}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={st.empty}>No products found</Text>}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <ScrollView>
              <Text style={st.modalTitle}>{editingProduct ? "Edit Product" : "Add Product"}</Text>
              <View style={st.field}><Text style={st.label}>Name *</Text>
                <TextInput style={st.input} value={formData.name} onChangeText={v => setFormData(p => ({ ...p, name: v }))} />
              </View>
              <View style={st.field}><Text style={st.label}>Description</Text>
                <TextInput style={[st.input, { height: 80, textAlignVertical: "top" }]} value={formData.description} onChangeText={v => setFormData(p => ({ ...p, description: v }))} multiline />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={[st.field, { flex: 1 }]}><Text style={st.label}>Price *</Text>
                  <TextInput style={st.input} value={formData.price} onChangeText={v => setFormData(p => ({ ...p, price: v }))} keyboardType="numeric" />
                </View>
                <View style={[st.field, { flex: 1 }]}><Text style={st.label}>Stock *</Text>
                  <TextInput style={st.input} value={formData.stock} onChangeText={v => setFormData(p => ({ ...p, stock: v }))} keyboardType="numeric" />
                </View>
              </View>
              <View style={st.field}><Text style={st.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                  {categories.map(c => (
                    <TouchableOpacity key={c._id} style={[st.chip2, formData.category === c._id && st.chip2Active]} onPress={() => setFormData(p => ({ ...p, category: c._id }))}>
                      <Text style={formData.category === c._id ? st.chip2TextActive : st.chip2Text}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={st.field}><Text style={st.label}>Sizes</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {SIZES.map(sz => (
                    <TouchableOpacity key={sz} style={[st.sizeBtn, formData.size.includes(sz) && st.sizeBtnActive]} onPress={() => handleSizeToggle(sz)}>
                      <Text style={formData.size.includes(sz) ? st.sizeBtnTextActive : st.sizeBtnText}>{sz}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={st.field}><Text style={st.label}>Image URLs</Text>
                {formData.images.map((img, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                    <TextInput style={[st.input, { flex: 1 }]} value={img} onChangeText={v => handleImageChange(i, v)} placeholder="https://..." placeholderTextColor="#999" />
                    {formData.images.length > 1 && (
                      <TouchableOpacity style={st.removeImgBtn} onPress={() => setFormData(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}>
                        <Text style={{ color: COLORS.red }}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={st.addImgBtn} onPress={() => setFormData(p => ({ ...p, images: [...p.images, ""] }))}>
                  <Text style={{ color: COLORS.indigo, fontWeight: "600" }}>+ Add Image</Text>
                </TouchableOpacity>
              </View>
              <View style={st.modalActions}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setShowModal(false)}><Text style={st.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={st.saveBtn} onPress={handleSubmit}><Text style={st.saveText}>{editingProduct ? "Update" : "Add"}</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  toolbar: { padding: 12, paddingBottom: 0 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  chip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, borderRadius: 8, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  chipText: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  dropdown: { backgroundColor: COLORS.white, marginHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginTop: 4, zIndex: 10 },
  dropItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropText: { fontSize: 14, color: COLORS.text },
  dropActive: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  addBtn: { backgroundColor: COLORS.primary, marginHorizontal: 12, paddingVertical: 14, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  addText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 12, marginHorizontal: 12, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardRow: { flexDirection: "row" },
  thumb: { width: 70, height: 70, borderRadius: 10 },
  prodName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  prodPrice: { fontSize: 15, fontWeight: "600", color: COLORS.green, marginTop: 2 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  prodMeta: { fontSize: 12, color: COLORS.light },
  actions: { flexDirection: "row", marginTop: 12, gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", padding: 40, color: COLORS.light, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: COLORS.text },
  chip2: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F3F4F6", marginRight: 8 },
  chip2Active: { backgroundColor: COLORS.primary },
  chip2Text: { fontSize: 13, color: COLORS.text },
  chip2TextActive: { fontSize: 13, color: COLORS.white, fontWeight: "600" },
  sizeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F3F4F6" },
  sizeBtnActive: { backgroundColor: COLORS.indigo },
  sizeBtnText: { fontSize: 13, color: COLORS.text },
  sizeBtnTextActive: { fontSize: 13, color: COLORS.white, fontWeight: "600" },
  removeImgBtn: { justifyContent: "center", paddingHorizontal: 8 },
  addImgBtn: { alignItems: "center", paddingVertical: 12, borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.border, borderRadius: 8, marginTop: 4 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.text, fontWeight: "600" },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORS.primary },
  saveText: { color: COLORS.white, fontWeight: "700" },
});
