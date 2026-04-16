/**
 * Connect screen — BLE scanner, WiFi IP entry, USB device list.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { Device } from "react-native-ble-plx";
import { router } from "expo-router";
import { BLETransport } from "../src/transport/BLETransport";
import { useOBD } from "../src/hooks/useOBD";
import { useConnectionStore } from "../src/store/connectionStore";
import { AdapterProfile, DEFAULT_BLE_SERVICE_UUID, DEFAULT_BLE_CHARACTERISTIC_UUID } from "../src/transport/types";

type Tab = "ble" | "wifi" | "usb";

export default function ConnectScreen() {
  const [tab, setTab] = useState<Tab>("ble");
  const [scanning, setScanning] = useState(false);
  const [bleDevices, setBleDevices] = useState<Device[]>([]);
  const [wifiHost, setWifiHost] = useState("192.168.0.10");
  const [wifiPort, setWifiPort] = useState("35000");
  const [connecting, setConnecting] = useState<string | null>(null);

  const { connect } = useOBD();
  const { profiles, addProfile } = useConnectionStore();

  const bleTransport = React.useRef<BLETransport | null>(null);

  useEffect(() => {
    bleTransport.current = new BLETransport();
    return () => {
      bleTransport.current?.stopScan();
      bleTransport.current?.destroy();
    };
  }, []);

  const startBLEScan = useCallback(async () => {
    if (!bleTransport.current) return;
    setBleDevices([]);
    setScanning(true);

    try {
      await bleTransport.current.scanForDevices(
        (device) => {
          setBleDevices((prev) => {
            if (prev.find((d) => d.id === device.id)) return prev;
            return [...prev, device];
          });
        },
        10000
      );
    } finally {
      setScanning(false);
    }
  }, []);

  const connectBLE = useCallback(
    async (device: Device) => {
      setConnecting(device.id);
      const profile: AdapterProfile = {
        id: device.id,
        name: device.name ?? `BLE ${device.id.slice(-6)}`,
        type: "ble",
        bleServiceUUID: DEFAULT_BLE_SERVICE_UUID,
        bleCharacteristicUUID: DEFAULT_BLE_CHARACTERISTIC_UUID,
      };

      try {
        // Save profile if not already saved
        if (!profiles.find((p) => p.id === device.id)) {
          addProfile(profile);
        }
        await connect(profile);
        router.back();
      } catch {
        // Error is set in store by useOBD
      } finally {
        setConnecting(null);
      }
    },
    [connect, profiles, addProfile]
  );

  const connectWiFi = useCallback(async () => {
    const profile: AdapterProfile = {
      id: `wifi-${wifiHost}-${wifiPort}`,
      name: `WiFi ${wifiHost}:${wifiPort}`,
      type: "wifi",
      wifiHost,
      wifiPort: parseInt(wifiPort, 10),
    };
    setConnecting(profile.id);
    try {
      if (!profiles.find((p) => p.id === profile.id)) {
        addProfile(profile);
      }
      await connect(profile);
      router.back();
    } finally {
      setConnecting(null);
    }
  }, [wifiHost, wifiPort, connect, profiles, addProfile]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Tab bar */}
      <View style={{ flexDirection: "row", padding: 16, paddingBottom: 8, gap: 8 }}>
        {(["ble", "wifi", "usb"] as Tab[]).map((t) => {
          if (t === "usb" && Platform.OS === "ios") return null;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                backgroundColor: tab === t ? "#0ea5e9" : "#1e293b",
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
            >
              <Text style={{ color: tab === t ? "#fff" : "#64748b", fontSize: 13, fontWeight: "600" }}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* BLE tab */}
      {tab === "ble" && (
        <View style={{ flex: 1 }}>
          <View style={{ padding: 16, paddingTop: 8 }}>
            <TouchableOpacity
              onPress={startBLEScan}
              disabled={scanning}
              style={{
                backgroundColor: scanning ? "#334155" : "#0ea5e9",
                borderRadius: 10,
                padding: 14,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel="Scan for Bluetooth devices"
            >
              {scanning ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontSize: 16 }}>📶</Text>
              )}
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {scanning ? "Scanning..." : "Scan for Devices"}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={bleDevices}
            keyExtractor={(d) => d.id}
            contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 8 }}
            ListEmptyComponent={
              !scanning ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Text style={{ color: "#64748b", fontSize: 14 }}>
                    No devices found. Start scanning.
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => connectBLE(item)}
                disabled={connecting !== null}
                style={{
                  backgroundColor: "#1e293b",
                  borderRadius: 10,
                  padding: 14,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel={`Connect to ${item.name ?? item.id}`}
              >
                <View>
                  <Text style={{ color: "#f1f5f9", fontSize: 14, fontWeight: "600" }}>
                    {item.name ?? "Unknown Device"}
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>
                    {item.id}
                  </Text>
                  {item.rssi && (
                    <Text style={{ color: "#475569", fontSize: 11 }}>
                      RSSI: {item.rssi} dBm
                    </Text>
                  )}
                </View>
                {connecting === item.id ? (
                  <ActivityIndicator size="small" color="#0ea5e9" />
                ) : (
                  <Text style={{ color: "#0ea5e9", fontSize: 13 }}>Connect</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* WiFi tab */}
      {tab === "wifi" && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>IP Address</Text>
            <TextInput
              value={wifiHost}
              onChangeText={setWifiHost}
              style={{
                backgroundColor: "#1e293b",
                borderRadius: 10,
                padding: 12,
                color: "#f1f5f9",
                fontSize: 14,
                fontVariant: ["tabular-nums"],
              }}
              keyboardType="decimal-pad"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>Port</Text>
            <TextInput
              value={wifiPort}
              onChangeText={setWifiPort}
              style={{
                backgroundColor: "#1e293b",
                borderRadius: 10,
                padding: 12,
                color: "#f1f5f9",
                fontSize: 14,
              }}
              keyboardType="numeric"
              placeholderTextColor="#475569"
            />
          </View>
          <Text style={{ color: "#475569", fontSize: 12, lineHeight: 18 }}>
            Common default: 192.168.0.10:35000 for most WiFi ELM327 adapters.
            Check your adapter's manual for the correct IP.
          </Text>
          <TouchableOpacity
            onPress={connectWiFi}
            disabled={connecting !== null}
            style={{
              backgroundColor: "#0ea5e9",
              borderRadius: 10,
              padding: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
            accessibilityRole="button"
          >
            {connecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ fontSize: 16 }}>📡</Text>
            )}
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {connecting ? "Connecting..." : "Connect via WiFi"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* USB tab (Android only) */}
      {tab === "usb" && Platform.OS === "android" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔌</Text>
          <Text style={{ color: "#94a3b8", fontSize: 16, textAlign: "center" }}>
            USB adapters are detected automatically when plugged in.
          </Text>
          <Text style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginTop: 8 }}>
            Connect your ELM327 USB adapter and grant USB permission when prompted.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
