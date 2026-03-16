import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MENU_ITEMS = [
  { label: "SHOP", path: "/shop" },
  { label: "CONTACT", path: "/contact" },
  { label: "ABOUT", path: "/about" },
  { label: "BEST SELLER", path: "/bestseller" },
];

export default function Header() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, isAdmin, isManager, isStaff } = useAuth();
  const { getCartItemsCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cartCount = getCartItemsCount();

  const dashboardEntry = useMemo(() => {
    if (isAdmin()) {
      return { label: "Admin Dashboard", path: "/admin/dashboard" };
    }

    if (isManager()) {
      return { label: "Manager Dashboard", path: "/manager/dashboard" };
    }

    if (isStaff()) {
      return { label: "Staff Dashboard", path: "/staff/dashboard" };
    }

    return null;
  }, [isAdmin, isManager, isStaff]);

  const navigateTo = (path: string) => {
    router.push(path as any);
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setMenuOpen(false);
    setUserMenuOpen((prev) => !prev);
  };

  const toggleMainMenu = () => {
    setUserMenuOpen(false);
    setMenuOpen((prev) => !prev);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigateTo("/shop");
    setSearchQuery("");
  };

  const safeTop = Math.max(insets.top, 12);

  return (
    <View style={[styles.header, { paddingTop: safeTop }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigateTo("/")}
          hitSlop={styles.hitSlop}
          activeOpacity={0.8}
        >
          <Image
            source={{
              uri: "https://via.placeholder.com/56x56/000000/ffffff?text=NOW",
            }}
            style={styles.logo}
          />
        </TouchableOpacity>

        <View style={styles.headerIcons}>
          {user ? (
            <TouchableOpacity
              onPress={toggleUserMenu}
              style={styles.iconBtn}
              hitSlop={styles.hitSlop}
              activeOpacity={0.8}
            >
              <Feather name="user" size={22} color="#1a1a1a" />
              <Text style={styles.usernameTxt} numberOfLines={1}>
                {user.username}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigateTo("/auth")}
              style={styles.iconBtn}
              hitSlop={styles.hitSlop}
              activeOpacity={0.8}
            >
              <Feather name="user" size={22} color="#1a1a1a" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigateTo("/cart")}
            style={styles.iconBtn}
            hitSlop={styles.hitSlop}
            activeOpacity={0.8}
          >
            <Feather name="shopping-bag" size={22} color="#1a1a1a" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeTxt}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleMainMenu}
            style={styles.iconBtn}
            hitSlop={styles.hitSlop}
            activeOpacity={0.8}
          >
            <Feather name={menuOpen ? "x" : "menu"} size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch} activeOpacity={0.8}>
          <Feather name="search" size={18} color="#999" />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={styles.mobileMenu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.path}
              onPress={() => navigateTo(item.path)}
              style={styles.menuItem}
              activeOpacity={0.8}
            >
              <Text style={styles.menuItemTxt}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {userMenuOpen && user && (
        <View style={[styles.userMenu, { top: safeTop + 56 }]}>
          {dashboardEntry && (
            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={() => navigateTo(dashboardEntry.path)}
              activeOpacity={0.8}
            >
              <Feather name="grid" size={16} color="#333" />
              <Text style={styles.userMenuTxt}>{dashboardEntry.label}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.userMenuItem,
              dashboardEntry ? styles.userMenuBorder : null,
            ]}
            onPress={() => navigateTo("/cart")}
            activeOpacity={0.8}
          >
            <Feather name="shopping-bag" size={16} color="#333" />
            <Text style={styles.userMenuTxt}>Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.userMenuItem, styles.userMenuBorder]}
            onPress={() => navigateTo("/")}
            activeOpacity={0.8}
          >
            <Feather name="home" size={16} color="#333" />
            <Text style={styles.userMenuTxt}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.userMenuItem, styles.userMenuBorder]}
            onPress={() => {
              logout?.();
              setUserMenuOpen(false);
            }}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={16} color="#e53e3e" />
            <Text style={[styles.userMenuTxt, styles.logoutTxt]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingHorizontal: 16,
    paddingBottom: 4,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 36,
    position: "relative",
  },
  usernameTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    maxWidth: 80,
  },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#e53e3e",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeTxt: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  mobileMenu: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingVertical: 4,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  menuItemTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  userMenu: {
    position: "absolute",
    right: 16,
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 200,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
  },
  userMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  userMenuBorder: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  userMenuTxt: {
    fontSize: 14,
    color: "#333",
  },
  logoutTxt: {
    color: "#e53e3e",
  },
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
});
