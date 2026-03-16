import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "@/api";

// --- 1. Define Interfaces for User and Auth ---
export interface Role {
  _id?: string;
  name: string;
}

export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  phone?: string;
  role?: string; // For cases where the server returns a single role
  roles?: Role[]; // For cases where the server returns an array of roles
  avatar?: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: string;
      username: string;
      name: string;
      email: string;
      role: string;
      roles: Role[];
      createdAt: string;
    };
    token: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: () => Promise<AuthResponse>;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isStaff: () => boolean;
}

// --- 2. Initialize Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check token when component mounts
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const savedUser = await AsyncStorage.getItem("user");

        if (token && savedUser) {
          const parsedUser: User = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        await AsyncStorage.multiRemove(["token", "user"]);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login
  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    try {
      const response = await authAPI.login({ email, password });

      if (response.success) {
        const { user, token } = response.data;

        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        setUser(user);
        setIsAuthenticated(true);
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }
      return {
        success: false,
        message: response.message || "Login failed",
        data: response.data,
      };
    } catch (error: any) {
      console.error("Login error in AuthContext:", error);
      const message = error.response?.data?.message || "Login failed";
      return { success: false, message, data: error.response?.data };
    }
  };

  // Register
  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<AuthResponse> => {
    try {
      const response = await authAPI.register({
        username: name,
        email,
        phone,
        password,
      });

      if (response.success) {
        const { user, token } = response.data;
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        setUser(user);
        setIsAuthenticated(true);
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }
      return {
        success: false,
        message: response.message || "Registration failed",
        data: response.data,
      };
    } catch (error: any) {
      console.error("Register error in AuthContext:", error);
      const message = error.response?.data?.message || "Registration failed";
      return { success: false, message, data: error.response?.data };
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Update user info from server
  const updateUser = async (): Promise<AuthResponse> => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        const updatedUser: User = response.data.user;
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Update user error:", error);
      return { success: false };
    }
  };

  // Helper functions for permission checks
  const isAdmin = (): boolean => {
    if (!user) return false;
    return (
      user.roles?.some((role) => role.name === "admin") || user.role === "admin"
    );
  };

  const isManager = (): boolean => {
    if (!user) return false;
    return (
      user.roles?.some((role) => role.name === "manager") ||
      user.role === "manager"
    );
  };

  const isStaff = (): boolean => {
    if (!user) return false;
    return (
      user.roles?.some((role) => role.name === "staff") ||
      user.role === "staff"
    );
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    isManager,
    isStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
