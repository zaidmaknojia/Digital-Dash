import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { DecodedDTC } from "../obd2/DTCService";

interface DTCCardProps {
  dtc: DecodedDTC;
  onDiagnose?: (dtc: DecodedDTC) => void;
}

const TYPE_COLORS: Record<DecodedDTC["type"], string> = {
  stored: "#ef4444",
  pending: "#f59e0b",
  permanent: "#dc2626",
};

const TYPE_LABELS: Record<DecodedDTC["type"], string> = {
  stored: "Stored",
  pending: "Pending",
  permanent: "Permanent",
};

export function DTCCard({ dtc, onDiagnose }: DTCCardProps) {
  const color = TYPE_COLORS[dtc.type];

  return (
    <View
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
      accessibilityLabel={`Fault code ${dtc.code}: ${dtc.description}`}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{ color: "#f1f5f9", fontSize: 18, fontWeight: "700" }}
          >
            {dtc.code}
          </Text>
          {dtc.isManufacturerSpecific && (
            <View
              style={{
                backgroundColor: "#334155",
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: "#94a3b8", fontSize: 10 }}>MFR</Text>
            </View>
          )}
        </View>

        <View
          style={{
            backgroundColor: color + "22",
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color, fontSize: 11, fontWeight: "600" }}>
            {TYPE_LABELS[dtc.type]}
          </Text>
        </View>
      </View>

      <Text style={{ color: "#94a3b8", fontSize: 14, lineHeight: 20 }}>
        {dtc.description}
      </Text>

      {onDiagnose && (
        <TouchableOpacity
          onPress={() => onDiagnose(dtc)}
          style={{
            marginTop: 12,
            backgroundColor: "#0ea5e9",
            borderRadius: 8,
            paddingVertical: 8,
            alignItems: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel={`Diagnose ${dtc.code} with AI`}
        >
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
            AI Diagnose
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
