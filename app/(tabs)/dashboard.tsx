/**
 * Dashboard — real-time PID gauges.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { usePIDs } from "../../src/hooks/usePIDs";
import { useConnectionStore } from "../../src/store/connectionStore";
import { Gauge } from "../../src/components/Gauge";
import { PIDSelector } from "../../src/components/PIDSelector";
import { getPIDByName } from "../../src/obd2/PIDRegistry";
import { PRIORITY_PIDS, WATCHDOG_THRESHOLDS } from "../../constants/pids";

const DEFAULT_SHOWN_PIDS = ["RPM", "SPEED", "COOLANT_TEMP", "ENGINE_LOAD", "THROTTLE", "MAF_RATE"];

export default function DashboardScreen() {
  const [shownPIDs, setShownPIDs] = useState<string[]>(DEFAULT_SHOWN_PIDS);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const { pidValues, isPolling } = usePIDs({ pids: Object.fromEntries(shownPIDs.map((p) => [p, 5])) });
  const { status } = useConnectionStore();

  const togglePID = (name: string) => {
    setShownPIDs((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  if (status !== "connected") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔌</Text>
        <Text style={{ color: "#94a3b8", fontSize: 16 }}>Not connected</Text>
        <Text style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Connect an OBD2 adapter to see live data
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isPolling ? "#22c55e" : "#f59e0b",
            }}
          />
          <Text style={{ color: "#94a3b8", fontSize: 13 }}>
            {isPolling ? "Live" : "Paused"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setSelectorVisible(true)}
          style={{
            backgroundColor: "#1e293b",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
          accessibilityRole="button"
          accessibilityLabel="Customize displayed PIDs"
        >
          <Text style={{ color: "#0ea5e9", fontSize: 13 }}>Customize</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
          padding: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {shownPIDs.map((pidName) => {
          const def = getPIDByName(pidName);
          if (!def) return null;
          const value = pidValues[pidName] ?? 0;
          const watchdog = WATCHDOG_THRESHOLDS[pidName];

          return (
            <Gauge
              key={pidName}
              value={value}
              minValue={def.minValue}
              maxValue={def.maxValue}
              label={pidName.replace(/_/g, " ")}
              unit={def.unit}
              size={140}
              decimals={def.decimals}
              warningThreshold={watchdog?.max}
              cautionThreshold={
                watchdog?.max !== undefined ? watchdog.max * 0.85 : undefined
              }
            />
          );
        })}
      </ScrollView>

      {/* PID Selector Modal */}
      <Modal
        visible={selectorVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#1e293b",
            }}
          >
            <Text style={{ color: "#f1f5f9", fontSize: 18, fontWeight: "700" }}>
              Customize PIDs
            </Text>
            <TouchableOpacity
              onPress={() => setSelectorVisible(false)}
              accessibilityRole="button"
            >
              <Text style={{ color: "#0ea5e9", fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: "#64748b", fontSize: 13, padding: 16, paddingBottom: 8 }}>
            {shownPIDs.length}/8 selected
          </Text>
          <PIDSelector selected={shownPIDs} onToggle={togglePID} maxSelected={8} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
