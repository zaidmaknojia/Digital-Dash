/**
 * DTCs screen — read, diagnose, and clear fault codes.
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useDTCs } from "../../src/hooks/useDTCs";
import { useConnectionStore } from "../../src/store/connectionStore";
import { DTCCard } from "../../src/components/DTCCard";
import { DecodedDTC } from "../../src/obd2/DTCService";

export default function DTCsScreen() {
  const {
    storedDTCs,
    pendingDTCs,
    permanentDTCs,
    hasDTCs,
    isReading,
    isClearing,
    readDTCs,
    clearDTCs,
  } = useDTCs();

  const { status } = useConnectionStore();
  const isConnected = status === "connected";

  // Auto-read on mount when connected
  useEffect(() => {
    if (isConnected) {
      readDTCs();
    }
  }, [isConnected]);

  const handleDiagnose = (dtc: DecodedDTC) => {
    router.push(`/diagnose/${dtc.code}`);
  };

  const handleDiagnoseAll = () => {
    router.push("/diagnose/all");
  };

  if (!isConnected) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔌</Text>
        <Text style={{ color: "#94a3b8", fontSize: 16 }}>Not connected</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Action bar */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          padding: 16,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={readDTCs}
          disabled={isReading}
          style={{
            flex: 1,
            backgroundColor: "#1e293b",
            borderRadius: 10,
            padding: 10,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          }}
          accessibilityRole="button"
          accessibilityLabel="Refresh fault codes"
        >
          {isReading ? (
            <ActivityIndicator size="small" color="#0ea5e9" />
          ) : (
            <Text style={{ fontSize: 16 }}>🔄</Text>
          )}
          <Text style={{ color: "#f1f5f9", fontSize: 13 }}>
            {isReading ? "Reading..." : "Refresh"}
          </Text>
        </TouchableOpacity>

        {hasDTCs && (
          <>
            <TouchableOpacity
              onPress={handleDiagnoseAll}
              style={{
                flex: 1,
                backgroundColor: "#0ea5e9",
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
              accessibilityRole="button"
              accessibilityLabel="AI diagnose all fault codes"
            >
              <Text style={{ fontSize: 16 }}>🤖</Text>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                Diagnose All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => clearDTCs()}
              disabled={isClearing}
              style={{
                backgroundColor: "#ef444422",
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                borderWidth: 1,
                borderColor: "#ef4444",
                paddingHorizontal: 12,
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear all fault codes"
            >
              {isClearing ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Text style={{ fontSize: 16 }}>🗑️</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isReading}
            onRefresh={readDTCs}
            tintColor="#0ea5e9"
          />
        }
      >
        {!hasDTCs && !isReading && (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={{ color: "#22c55e", fontSize: 18, fontWeight: "600" }}>
              No Fault Codes
            </Text>
            <Text style={{ color: "#64748b", fontSize: 14 }}>
              System check passed
            </Text>
          </View>
        )}

        {storedDTCs.length > 0 && (
          <Section title={`Stored (${storedDTCs.length})`}>
            {storedDTCs.map((dtc) => (
              <DTCCard
                key={`stored-${dtc.code}`}
                dtc={dtc}
                onDiagnose={handleDiagnose}
              />
            ))}
          </Section>
        )}

        {pendingDTCs.length > 0 && (
          <Section title={`Pending (${pendingDTCs.length})`}>
            {pendingDTCs.map((dtc) => (
              <DTCCard
                key={`pending-${dtc.code}`}
                dtc={dtc}
                onDiagnose={handleDiagnose}
              />
            ))}
          </Section>
        )}

        {permanentDTCs.length > 0 && (
          <Section title={`Permanent (${permanentDTCs.length})`}>
            {permanentDTCs.map((dtc) => (
              <DTCCard
                key={`permanent-${dtc.code}`}
                dtc={dtc}
                onDiagnose={handleDiagnose}
              />
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          color: "#64748b",
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
