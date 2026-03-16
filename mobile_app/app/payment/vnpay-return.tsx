import { vnpayAPI } from "@/api";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatParams = (rawParams: Record<string, string | string[] | undefined>) =>
  Object.entries(rawParams).reduce<Record<string, string>>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      if (value[0]) acc[key] = value[0];
      return acc;
    }

    if (typeof value === "string" && value.length > 0) {
      acc[key] = value;
    }

    return acc;
  }, {});

type VnpayResult = {
  isVerified?: boolean;
  isSuccess?: boolean;
  orderId?: string;
  message?: string;
};

export default function VnpayReturnScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const params = useMemo(() => formatParams(rawParams), [rawParams]);
  const hasParams = Object.keys(params).length > 0;

  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    data: VnpayResult | null;
  }>(() => ({
    loading: hasParams,
    error: hasParams ? null : "Missing VNPay return parameters.",
    data: null,
  }));

  useEffect(() => {
    if (!hasParams) return;

    let active = true;

    vnpayAPI
      .verifyReturn(params)
      .then((data) => {
        if (!active) return;
        setState({ loading: false, error: null, data });
      })
      .catch((error: any) => {
        if (!active) return;
        setState({
          loading: false,
          error:
            error?.response?.data?.message ||
            "Unable to verify the transaction.",
          data: null,
        });
      });

    return () => {
      active = false;
    };
  }, [hasParams, params]);

  const isSuccess = Boolean(state.data?.isVerified && state.data?.isSuccess);
  const title = state.loading
    ? "Verifying Transaction..."
    : state.error
      ? "Transaction Verification Failed"
      : isSuccess
        ? "Payment Successful"
        : "Payment Not Completed";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.hero}>
            <View style={styles.heroRow}>
              <View style={styles.iconWrap}>
                {state.loading ? (
                  <ActivityIndicator size="large" color="#ffffff" />
                ) : state.error ? (
                  <Feather name="x" size={34} color="#ffffff" />
                ) : isSuccess ? (
                  <Feather name="check" size={34} color="#ffffff" />
                ) : (
                  <Feather name="alert-triangle" size={34} color="#ffffff" />
                )}
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>{title}</Text>
              </View>
            </View>
          </View>

          <View style={styles.body}>
            {state.loading && (
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>
                  Please wait while we verify your VNPay transaction.
                </Text>
                <View style={styles.dotsRow}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            )}

            {state.error && (
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{state.error}</Text>
              </View>
            )}

            {!state.loading && !state.error && (
              <View style={styles.infoGroup}>
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>
                    {state.data?.message || "The transaction has been processed."}
                  </Text>
                </View>

                {state.data?.orderId ? (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Order ID</Text>
                    <Text style={styles.infoCode}>{state.data.orderId}</Text>
                  </View>
                ) : null}

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Verification Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      state.data?.isVerified
                        ? styles.statusBadgeVerified
                        : styles.statusBadgeIdle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        state.data?.isVerified
                          ? styles.statusBadgeTextVerified
                          : styles.statusBadgeTextIdle,
                      ]}
                    >
                      {state.data?.isVerified ? "Verified" : "Not Verified"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (isSuccess && state.data?.orderId) {
                  router.push(`/orders/${state.data.orderId}` as any);
                  return;
                }

                router.push("/cart");
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isSuccess ? "View Order" : "Back to Cart"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/")}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!state.loading && (
          <View style={styles.supportWrap}>
            <Text style={styles.supportText}>
              If you need help, please contact customer support.
            </Text>
          </View>
        )}
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
    paddingVertical: 24,
  },
  card: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  hero: {
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  messageBox: {
    borderLeftWidth: 4,
    borderLeftColor: "#000000",
    backgroundColor: "#f9fafb",
    padding: 16,
  },
  messageText: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000000",
  },
  infoGroup: {
    gap: 16,
  },
  infoCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    padding: 16,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoCode: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadgeVerified: {
    borderColor: "#000000",
    backgroundColor: "#000000",
  },
  statusBadgeIdle: {
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statusBadgeTextVerified: {
    color: "#ffffff",
  },
  statusBadgeTextIdle: {
    color: "#111827",
  },
  footer: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  primaryButton: {
    borderWidth: 2,
    borderColor: "#000000",
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  supportWrap: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 20,
    alignItems: "center",
  },
  supportText: {
    textAlign: "center",
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
  },
});
