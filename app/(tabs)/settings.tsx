/**
 * Settings tab — adapter config, vehicle profiles, unit preferences, API keys.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useVehicleStore, VehicleProfile } from "../../src/store/vehicleStore";
import { useConnectionStore } from "../../src/store/connectionStore";
import { AdapterProfile } from "../../src/transport/types";

export default function SettingsScreen() {
  const {
    activeVehicle,
    vehicles,
    addVehicle,
    updateVehicle,
    removeVehicle,
    setActiveVehicle,
    units,
    setUnits,
  } = useVehicleStore();

  const {
    profiles,
    addProfile,
    removeProfile,
    activeProfile,
    setActiveProfile,
  } = useConnectionStore();

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showAdapterForm, setShowAdapterForm] = useState(false);
  const [showAPIKeys, setShowAPIKeys] = useState(false);
  const [serpApiKey, setSerpApiKey] = useState("");
  const [ebayAppId, setEbayAppId] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");

  React.useEffect(() => {
    loadAPIKeys();
  }, []);

  async function loadAPIKeys() {
    const [serp, ebay, ollama] = await Promise.all([
      SecureStore.getItemAsync("SERP_API_KEY"),
      SecureStore.getItemAsync("EBAY_APP_ID"),
      SecureStore.getItemAsync("OLLAMA_URL"),
    ]);
    if (serp) setSerpApiKey(serp);
    if (ebay) setEbayAppId(ebay);
    if (ollama) setOllamaUrl(ollama);
  }

  async function saveAPIKeys() {
    await Promise.all([
      serpApiKey
        ? SecureStore.setItemAsync("SERP_API_KEY", serpApiKey)
        : SecureStore.deleteItemAsync("SERP_API_KEY"),
      ebayAppId
        ? SecureStore.setItemAsync("EBAY_APP_ID", ebayAppId)
        : SecureStore.deleteItemAsync("EBAY_APP_ID"),
      SecureStore.setItemAsync("OLLAMA_URL", ollamaUrl),
    ]);
    Alert.alert("Saved", "API keys saved securely.");
    setShowAPIKeys(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Profiles */}
        <Section title="Vehicle Profiles">
          {vehicles.map((v) => (
            <VehicleRow
              key={v.id}
              vehicle={v}
              isActive={activeVehicle?.id === v.id}
              onActivate={() => setActiveVehicle(v)}
              onDelete={() => {
                Alert.alert("Remove Vehicle", `Remove ${v.name}?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => removeVehicle(v.id),
                  },
                ]);
              }}
            />
          ))}
          <TouchableOpacity
            onPress={() => setShowVehicleForm(true)}
            style={addButtonStyle}
            accessibilityRole="button"
          >
            <Text style={{ color: "#0ea5e9", fontSize: 14 }}>+ Add Vehicle</Text>
          </TouchableOpacity>
        </Section>

        {/* Adapter Profiles */}
        <Section title="OBD2 Adapters">
          {profiles.map((p) => (
            <AdapterRow
              key={p.id}
              profile={p}
              isActive={activeProfile?.id === p.id}
              onActivate={() => setActiveProfile(p)}
              onDelete={() => removeProfile(p.id)}
            />
          ))}
          <TouchableOpacity
            onPress={() => setShowAdapterForm(true)}
            style={addButtonStyle}
            accessibilityRole="button"
          >
            <Text style={{ color: "#0ea5e9", fontSize: 14 }}>+ Add Adapter</Text>
          </TouchableOpacity>
        </Section>

        {/* Units */}
        <Section title="Units">
          <SegmentedControl
            label="Speed"
            options={[{ label: "km/h", value: "kmh" }, { label: "mph", value: "mph" }]}
            value={units.speed}
            onChange={(v) => setUnits({ speed: v as "kmh" | "mph" })}
          />
          <SegmentedControl
            label="Temperature"
            options={[{ label: "°C", value: "celsius" }, { label: "°F", value: "fahrenheit" }]}
            value={units.temperature}
            onChange={(v) => setUnits({ temperature: v as "celsius" | "fahrenheit" })}
          />
          <SegmentedControl
            label="Pressure"
            options={[{ label: "kPa", value: "kpa" }, { label: "PSI", value: "psi" }]}
            value={units.pressure}
            onChange={(v) => setUnits({ pressure: v as "kpa" | "psi" })}
          />
        </Section>

        {/* API Keys */}
        <Section title="AI & Data Sources">
          <TouchableOpacity
            onPress={() => setShowAPIKeys(true)}
            style={{
              backgroundColor: "#1e293b",
              borderRadius: 10,
              padding: 14,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
            accessibilityRole="button"
          >
            <View>
              <Text style={{ color: "#f1f5f9", fontSize: 14 }}>API Keys</Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                SerpAPI, eBay Motors, Ollama URL
              </Text>
            </View>
            <Text style={{ color: "#64748b", fontSize: 16 }}>→</Text>
          </TouchableOpacity>
        </Section>

        <Text style={{ color: "#334155", fontSize: 12, textAlign: "center" }}>
          OBD2 Diagnostics v1.0.0
        </Text>
      </ScrollView>

      {/* Vehicle Form Modal */}
      <AddVehicleModal
        visible={showVehicleForm}
        onClose={() => setShowVehicleForm(false)}
        onAdd={(v) => {
          addVehicle(v);
          if (!activeVehicle) setActiveVehicle(v);
          setShowVehicleForm(false);
        }}
      />

      {/* Adapter Form Modal */}
      <AddAdapterModal
        visible={showAdapterForm}
        onClose={() => setShowAdapterForm(false)}
        onAdd={(p) => {
          addProfile(p);
          setShowAdapterForm(false);
        }}
      />

      {/* API Keys Modal */}
      <Modal
        visible={showAPIKeys}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAPIKeys(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
            <Text style={{ color: "#f1f5f9", fontSize: 18, fontWeight: "700" }}>API Keys</Text>
            <TouchableOpacity onPress={() => setShowAPIKeys(false)}>
              <Text style={{ color: "#64748b", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <LabeledInput
              label="SerpAPI Key"
              placeholder="Enter SerpAPI key"
              value={serpApiKey}
              onChangeText={setSerpApiKey}
              secureTextEntry
            />
            <LabeledInput
              label="eBay App ID"
              placeholder="Enter eBay App ID"
              value={ebayAppId}
              onChangeText={setEbayAppId}
              secureTextEntry
            />
            <LabeledInput
              label="Ollama URL"
              placeholder="http://localhost:11434"
              value={ollamaUrl}
              onChangeText={setOllamaUrl}
            />
            <Text style={{ color: "#64748b", fontSize: 12, lineHeight: 18 }}>
              Keys are stored encrypted on-device using Expo SecureStore and never transmitted except to their respective APIs.
            </Text>
            <TouchableOpacity onPress={saveAPIKeys} style={primaryButtonStyle}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Save Keys</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        {title}
      </Text>
      <View style={{ gap: 6 }}>{children}</View>
    </View>
  );
}

function VehicleRow({
  vehicle,
  isActive,
  onActivate,
  onDelete,
}: {
  vehicle: VehicleProfile;
  isActive: boolean;
  onActivate: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onActivate}
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 10,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: isActive ? 1 : 0,
        borderColor: "#0ea5e9",
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: isActive }}
    >
      <View>
        <Text style={{ color: "#f1f5f9", fontSize: 14, fontWeight: "600" }}>
          {vehicle.name}
        </Text>
        <Text style={{ color: "#64748b", fontSize: 12 }}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={{ padding: 4 }} accessibilityRole="button">
        <Text style={{ color: "#ef4444", fontSize: 16 }}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function AdapterRow({
  profile,
  isActive,
  onActivate,
  onDelete,
}: {
  profile: AdapterProfile;
  isActive: boolean;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const typeEmoji = { ble: "📶", wifi: "📡", usb: "🔌" }[profile.type];
  return (
    <TouchableOpacity
      onPress={onActivate}
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 10,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: isActive ? 1 : 0,
        borderColor: "#0ea5e9",
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: isActive }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 18 }}>{typeEmoji}</Text>
        <View>
          <Text style={{ color: "#f1f5f9", fontSize: 14, fontWeight: "600" }}>
            {profile.name}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
            {profile.type}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} style={{ padding: 4 }} accessibilityRole="button">
        <Text style={{ color: "#ef4444", fontSize: 16 }}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ color: "#94a3b8", fontSize: 14 }}>{label}</Text>
      <View style={{ flexDirection: "row", backgroundColor: "#334155", borderRadius: 8, padding: 2 }}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 6,
              backgroundColor: value === o.value ? "#0ea5e9" : "transparent",
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === o.value }}
          >
            <Text style={{ color: value === o.value ? "#fff" : "#64748b", fontSize: 12 }}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function LabeledInput({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: "#1e293b",
          borderRadius: 10,
          padding: 12,
          color: "#f1f5f9",
          fontSize: 14,
          borderWidth: 1,
          borderColor: "#334155",
        }}
        placeholderTextColor="#475569"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
    </View>
  );
}

function AddVehicleModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (v: VehicleProfile) => void;
}) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");

  const submit = () => {
    if (!name || !year || !make || !model) {
      Alert.alert("Missing fields", "Name, year, make, and model are required.");
      return;
    }
    onAdd({
      id: `vehicle-${Date.now()}`,
      name,
      year: parseInt(year, 10),
      make,
      model,
      vin: vin || undefined,
      mileage: mileage ? parseInt(mileage, 10) : undefined,
    });
    setName(""); setYear(""); setMake(""); setModel(""); setVin(""); setMileage("");
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
          <Text style={{ color: "#f1f5f9", fontSize: 18, fontWeight: "700" }}>Add Vehicle</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ color: "#64748b" }}>Cancel</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <LabeledInput label="Display Name" placeholder="My Car" value={name} onChangeText={setName} />
          <LabeledInput label="Year" placeholder="2019" value={year} onChangeText={setYear} keyboardType="numeric" />
          <LabeledInput label="Make" placeholder="BMW" value={make} onChangeText={setMake} />
          <LabeledInput label="Model" placeholder="330i" value={model} onChangeText={setModel} />
          <LabeledInput label="VIN (optional)" placeholder="1HGBH41JXMN109186" value={vin} onChangeText={setVin} />
          <LabeledInput label="Mileage (optional)" placeholder="45000" value={mileage} onChangeText={setMileage} keyboardType="numeric" />
          <TouchableOpacity onPress={submit} style={primaryButtonStyle}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Add Vehicle</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function AddAdapterModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (p: AdapterProfile) => void;
}) {
  const [name, setName] = useState("ELM327 Adapter");
  const [type, setType] = useState<"ble" | "wifi" | "usb">("ble");
  const [bleService, setBleService] = useState("FFE0");
  const [bleChar, setBleChar] = useState("FFE1");
  const [wifiHost, setWifiHost] = useState("192.168.0.10");
  const [wifiPort, setWifiPort] = useState("35000");

  const submit = () => {
    const profile: AdapterProfile = {
      id: `adapter-${Date.now()}`,
      name,
      type,
      bleServiceUUID: type === "ble" ? bleService : undefined,
      bleCharacteristicUUID: type === "ble" ? bleChar : undefined,
      wifiHost: type === "wifi" ? wifiHost : undefined,
      wifiPort: type === "wifi" ? parseInt(wifiPort, 10) : undefined,
    };
    onAdd(profile);
    setName("ELM327 Adapter");
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
          <Text style={{ color: "#f1f5f9", fontSize: 18, fontWeight: "700" }}>Add Adapter</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ color: "#64748b" }}>Cancel</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <LabeledInput label="Name" placeholder="ELM327 Adapter" value={name} onChangeText={setName} />
          <View>
            <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>Connection Type</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["ble", "wifi", "usb"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={{ flex: 1, backgroundColor: type === t ? "#0ea5e9" : "#1e293b", borderRadius: 8, padding: 10, alignItems: "center" }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: type === t }}
                >
                  <Text style={{ color: type === t ? "#fff" : "#64748b", fontSize: 12, textTransform: "uppercase" }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {type === "ble" && (
            <>
              <LabeledInput label="Service UUID" placeholder="FFE0" value={bleService} onChangeText={setBleService} />
              <LabeledInput label="Characteristic UUID" placeholder="FFE1" value={bleChar} onChangeText={setBleChar} />
            </>
          )}
          {type === "wifi" && (
            <>
              <LabeledInput label="IP Address" placeholder="192.168.0.10" value={wifiHost} onChangeText={setWifiHost} />
              <LabeledInput label="Port" placeholder="35000" value={wifiPort} onChangeText={setWifiPort} keyboardType="numeric" />
            </>
          )}
          <TouchableOpacity onPress={submit} style={primaryButtonStyle}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Add Adapter</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const addButtonStyle = {
  backgroundColor: "#1e293b",
  borderRadius: 10,
  padding: 12,
  alignItems: "center" as const,
  borderWidth: 1,
  borderColor: "#334155",
  borderStyle: "dashed" as const,
};

const primaryButtonStyle = {
  backgroundColor: "#0ea5e9",
  borderRadius: 10,
  padding: 14,
  alignItems: "center" as const,
};
