import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Platform } from "react-native";

const API_PORT = "5001";
const LAN_FALLBACK_HOST = "192.168.102.6";

const getExpoHost = () => {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const host = candidate?.split(":")[0];
    if (host) {
      return host;
    }
  }

  return null;
};

const getBaseURL = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${API_PORT}/api`;
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:${API_PORT}/api`;
  }

  return `http://${LAN_FALLBACK_HOST}:${API_PORT}/api`;
};

export const apiBaseURL = getBaseURL();

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // Clear old data
        await AsyncStorage.multiRemove(["token", "user"]);

        router.replace("/auth");
      } catch (e) {
        console.error("Error during logout", e);
      }
    }
    return Promise.reject(error);
  },
);

if (__DEV__) {
  console.log("API base URL:", apiBaseURL);
}

export default api;
