/**
 * Diagnosis screen — runs AI diagnosis and shows results.
 * Route param: id = DTC code ("P0300") or "all" for all active DTCs.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useDiagnosis } from "../../src/hooks/useDiagnosis";
import { useDTCs } from "../../src/hooks/useDTCs";
import { DiagnosisCard } from "../../src/components/DiagnosisCard";
import { useVehicleStore } from "../../src/store/vehicleStore";

export default function DiagnoseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { run, status, result, streamText, error, reset } = useDiagnosis();
  const { storedDTCs, pendingDTCs } = useDTCs();
  const { activeVehicle } = useVehicleStore();
  const [userDescription, setUserDescription] = useState("");
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll as stream text grows
  useEffect(() => {
    if (status === "running") {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [streamText, status]);

  const handleStart = () => {
    setStarted(true);
    run(userDescription || undefined);
  };

  const handleRetry = () => {
    reset();
    setStarted(false);
  };

  const targetDTCs =
    id === "all"
      ? [...storedDTCs, ...pendingDTCs]
      : [...storedDTCs, ...pendingDTCs].filter((d) => d.code === id);

  const vehicleStr = activeVehicle
    ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`
    : "Unknown vehicle";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View>
            <Text style={{ color: "#f1f5f9", fontSize: 20, fontWeight: "700" }}>
              {id === "all" ? "Full Diagnosis" : `Diagnosing ${id}`}
            </Text>
            <Text style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
              {vehicleStr}
            </Text>
          </View>

          {/* DTCs being diagnosed */}
          {targetDTCs.length > 0 && (
            <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 12, gap: 6 }}>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                Fault Codes
              </Text>
              {targetDTCs.map((dtc) => (
                <View key={`${dtc.code}-${dtc.type}`} style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "600" }}>
                    {dtc.code}
                  </Text>
                  <Text style={{ color: "#94a3b8", fontSize: 12, flex: 1 }} numberOfLines={1}>
                    {dtc.description}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* User description input */}
          {!started && (
            <View style={{ gap: 8 }}>
              <Text style={{ color: "#94a3b8", fontSize: 13 }}>
                Describe any symptoms (optional)
              </Text>
              <TextInput
                value={userDescription}
                onChangeText={setUserDescription}
                placeholder="e.g. Engine shakes at idle, check engine light on..."
                placeholderTextColor="#475569"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: "#1e293b",
                  borderRadius: 10,
                  padding: 12,
                  color: "#f1f5f9",
                  fontSize: 14,
                  lineHeight: 20,
                  textAlignVertical: "top",
                  minHeight: 80,
                  borderWidth: 1,
                  borderColor: "#334155",
                }}
              />
              <TouchableOpacity
                onPress={handleStart}
                style={{
                  backgroundColor: "#0ea5e9",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
                accessibilityRole="button"
                accessibilityLabel="Start AI diagnosis"
              >
                <Text style={{ fontSize: 20 }}>🤖</Text>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  Start AI Diagnosis
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Running state — stream text */}
          {status === "running" && (
            <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="#0ea5e9" />
                <Text style={{ color: "#0ea5e9", fontSize: 14, fontWeight: "600" }}>
                  Analyzing...
                </Text>
              </View>
              {streamText.length > 0 && (
                <Text style={{ color: "#94a3b8", fontSize: 13, lineHeight: 20 }}>
                  {streamText}
                </Text>
              )}
            </View>
          )}

          {/* Error */}
          {status === "error" && (
            <View style={{ backgroundColor: "#ef444422", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#ef4444", gap: 12 }}>
              <Text style={{ color: "#ef4444", fontSize: 14, fontWeight: "600" }}>
                Diagnosis Failed
              </Text>
              <Text style={{ color: "#fca5a5", fontSize: 13 }}>{error}</Text>
              <TouchableOpacity onPress={handleRetry} style={{ backgroundColor: "#ef4444", borderRadius: 8, padding: 10, alignItems: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Result */}
          {status === "done" && result && (
            <>
              <DiagnosisCard result={result} />
              <TouchableOpacity
                onPress={handleRetry}
                style={{
                  backgroundColor: "#1e293b",
                  borderRadius: 10,
                  padding: 12,
                  alignItems: "center",
                }}
                accessibilityRole="button"
              >
                <Text style={{ color: "#0ea5e9", fontSize: 14 }}>New Diagnosis</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
