import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { DiagnosisResult } from "../ai/types";

interface Props {
  result: DiagnosisResult;
}

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", label: "Critical", bg: "#ef444422" },
  moderate: { color: "#f59e0b", label: "Moderate", bg: "#f59e0b22" },
  low: { color: "#22c55e", label: "Low", bg: "#22c55e22" },
  monitor: { color: "#3b82f6", label: "Monitor", bg: "#3b82f622" },
};

const CONFIDENCE_COLORS = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#94a3b8",
};

const DIFFICULTY_LABELS = {
  easy: "Easy DIY",
  moderate: "Moderate DIY",
  hard: "Advanced DIY",
  professional_only: "Pro Only",
};

export function DiagnosisCard({ result }: Props) {
  const [expandedFix, setExpandedFix] = useState<number | null>(null);
  const sev = SEVERITY_CONFIG[result.severity];

  return (
    <View style={{ gap: 16 }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: sev.bg,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: sev.color + "44",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <View
            style={{
              backgroundColor: sev.bg,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderWidth: 1,
              borderColor: sev.color,
            }}
          >
            <Text style={{ color: sev.color, fontSize: 12, fontWeight: "700" }}>
              {sev.label.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={{ color: "#f1f5f9", fontSize: 15, lineHeight: 22 }}>
          {result.summary}
        </Text>
      </View>

      {/* Likely Causes */}
      {result.likely_causes.length > 0 && (
        <Section title="Likely Causes">
          {result.likely_causes.map((cause, i) => (
            <View
              key={i}
              style={{
                backgroundColor: "#1e293b",
                borderRadius: 8,
                padding: 12,
                marginBottom: 6,
                flexDirection: "row",
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: CONFIDENCE_COLORS[cause.confidence],
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f1f5f9", fontSize: 14, lineHeight: 20 }}>
                  {cause.cause}
                </Text>
                <Text
                  style={{
                    color: CONFIDENCE_COLORS[cause.confidence],
                    fontSize: 11,
                    marginTop: 4,
                    textTransform: "capitalize",
                  }}
                >
                  {cause.confidence} confidence
                </Text>
                {cause.source_urls.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {cause.source_urls.map((url, j) => (
                      <TouchableOpacity
                        key={j}
                        onPress={() => Linking.openURL(url)}
                        accessibilityRole="link"
                      >
                        <Text style={{ color: "#0ea5e9", fontSize: 11 }}>
                          Source {j + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </Section>
      )}

      {/* Recommended Fixes */}
      {result.recommended_fixes.length > 0 && (
        <Section title="Recommended Fixes">
          {result.recommended_fixes.map((fix, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setExpandedFix(expandedFix === i ? null : i)}
              style={{
                backgroundColor: "#1e293b",
                borderRadius: 8,
                padding: 12,
                marginBottom: 6,
              }}
              accessibilityRole="button"
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text
                  style={{
                    color: "#f1f5f9",
                    fontSize: 14,
                    fontWeight: "600",
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  {fix.fix}
                </Text>
                <Text style={{ color: "#64748b", fontSize: 14 }}>
                  {expandedFix === i ? "▲" : "▼"}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <Badge
                  label={DIFFICULTY_LABELS[fix.diy_difficulty]}
                  color={
                    fix.diy_difficulty === "easy"
                      ? "#22c55e"
                      : fix.diy_difficulty === "moderate"
                      ? "#f59e0b"
                      : fix.diy_difficulty === "hard"
                      ? "#f97316"
                      : "#ef4444"
                  }
                />
                <Badge
                  label={`$${fix.estimated_cost_usd.min}–$${fix.estimated_cost_usd.max}`}
                  color="#0ea5e9"
                />
              </View>

              {expandedFix === i && fix.parts.length > 0 && (
                <View style={{ marginTop: 10, gap: 4 }}>
                  <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>
                    Parts Required:
                  </Text>
                  {fix.parts.map((part, j) => (
                    <View key={j} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: "#94a3b8", fontSize: 13 }}>{part.name}</Text>
                      {part.price_range && (
                        <Text style={{ color: "#0ea5e9", fontSize: 13 }}>
                          {part.price_range}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {/* TSBs */}
      {result.tsbs.length > 0 && (
        <Section title="Technical Service Bulletins">
          {result.tsbs.map((tsb, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => Linking.openURL(tsb.url)}
              style={{
                backgroundColor: "#1e293b",
                borderRadius: 8,
                padding: 12,
                marginBottom: 6,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              accessibilityRole="link"
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: "#f1f5f9", fontSize: 13, fontWeight: "600" }}>
                  {tsb.id}
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                  {tsb.title}
                </Text>
              </View>
              <Text style={{ color: "#0ea5e9", fontSize: 13 }}>→</Text>
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {/* Disclaimer */}
      <Text style={{ color: "#475569", fontSize: 11, lineHeight: 16, padding: 4 }}>
        {result.disclaimer}
      </Text>
    </View>
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
    <View>
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

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        backgroundColor: color + "22",
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
