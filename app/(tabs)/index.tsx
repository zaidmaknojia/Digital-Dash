/**
 * Home tab — connection status, quick connect CTA, last session summary.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { useOBD } from "../../src/hooks/useOBD";
import { useDTCs } from "../../src/hooks/useDTCs";
import { useVehicleStore } from "../../src/store/vehicleStore";
import { useConnectionStore } from "../../src/store/connectionStore";
import { ConnectionStatus } from "../../src/components/ConnectionStatus";

export default function HomeScreen() {
  const { status, disconnect } = useOBD();
  const { allDTCs, hasDTCs } = useDTCs();
  const { activeVehicle } = useVehicleStore();
  const { elm327Info, activeProfile } = useConnectionStore();

  const isConnected = status === "connected";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <View>
            <Text style={{ color: "#f1f5f9", fontSize: 24, fontWeight: "700" }}>
              OBD2 Diagnostics
            </Text>
            {activeVehicle && (
              <Text style={{ color: "#64748b", fontSize: 14, marginTop: 2 }}>
                {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
              </Text>
            )}
          </View>
          <ConnectionStatus
            status={status}
            adapterName={activeProfile?.name}
            onPress={() => (isConnected ? disconnect() : router.push("/connect"))}
          />
        </View>

        {/* Connect Banner */}
        {!isConnected && (
          <TouchableOpacity
            onPress={() => router.push("/connect")}
            style={{
              backgroundColor: "#0ea5e9",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              gap: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel="Connect to OBD2 adapter"
          >
            <Text style={{ fontSize: 32 }}>🔌</Text>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              Connect Adapter
            </Text>
            <Text style={{ color: "#bae6fd", fontSize: 13 }}>
              Bluetooth, WiFi, or USB
            </Text>
          </TouchableOpacity>
        )}

        {/* Connected Info */}
        {isConnected && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 16, gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#f1f5f9", fontSize: 16, fontWeight: "600" }}>
                Adapter Connected
              </Text>
              <TouchableOpacity
                onPress={disconnect}
                style={{
                  backgroundColor: "#334155",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
                accessibilityRole="button"
              >
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>Disconnect</Text>
              </TouchableOpacity>
            </View>

            {elm327Info && (
              <View style={{ gap: 4 }}>
                <InfoRow label="Firmware" value={elm327Info.version} />
                <InfoRow label="Protocol" value={elm327Info.protocol || "Auto"} />
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8 }}>
              <ActionButton
                label="View Dashboard"
                emoji="📊"
                onPress={() => router.push("/(tabs)/dashboard")}
              />
              <ActionButton
                label="Read DTCs"
                emoji="⚠️"
                onPress={() => router.push("/(tabs)/dtcs")}
                accent={hasDTCs}
              />
            </View>
          </View>
        )}

        {/* DTC Summary */}
        {hasDTCs && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 16 }}>
            <Text style={{ color: "#f1f5f9", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              Active Fault Codes
            </Text>
            {allDTCs.slice(0, 3).map((dtc) => (
              <View
                key={`${dtc.code}-${dtc.type}`}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 6,
                  borderBottomWidth: 1,
                  borderBottomColor: "#334155",
                }}
              >
                <Text style={{ color: "#f59e0b", fontSize: 14, fontWeight: "600" }}>
                  {dtc.code}
                </Text>
                <Text
                  style={{ color: "#94a3b8", fontSize: 13, flex: 1, marginLeft: 12 }}
                  numberOfLines={1}
                >
                  {dtc.description}
                </Text>
              </View>
            ))}
            {allDTCs.length > 3 && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/dtcs")}>
                <Text style={{ color: "#0ea5e9", fontSize: 13, marginTop: 8 }}>
                  +{allDTCs.length - 3} more →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* No vehicle configured */}
        {!activeVehicle && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            style={{
              backgroundColor: "#1e293b",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderWidth: 1,
              borderColor: "#334155",
              borderStyle: "dashed",
            }}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 24 }}>🚗</Text>
            <View>
              <Text style={{ color: "#94a3b8", fontSize: 14 }}>
                No vehicle configured
              </Text>
              <Text style={{ color: "#0ea5e9", fontSize: 13 }}>
                Add vehicle in Settings →
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ color: "#64748b", fontSize: 13 }}>{label}</Text>
      <Text style={{ color: "#94a3b8", fontSize: 13 }}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  emoji,
  onPress,
  accent = false,
}: {
  label: string;
  emoji: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: accent ? "#0ea5e922" : "#334155",
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
        gap: 4,
        borderWidth: accent ? 1 : 0,
        borderColor: accent ? "#0ea5e9" : "transparent",
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ color: "#f1f5f9", fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}
