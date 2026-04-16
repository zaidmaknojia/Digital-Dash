/**
 * History tab — past sessions and DTC history timeline.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { useSessionStore, DiagnosticSession } from "../../src/store/sessionStore";

export default function HistoryScreen() {
  const { sessions, deleteSession, exportSessionJSON } = useSessionStore();

  const handleExport = (session: DiagnosticSession) => {
    const json = exportSessionJSON(session.id);
    if (!json) return;
    Share.share({
      title: `Session ${session.id}`,
      message: json,
    });
  };

  const handleDelete = (session: DiagnosticSession) => {
    Alert.alert(
      "Delete Session",
      `Delete session from ${formatDate(session.startedAt)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSession(session.id),
        },
      ]
    );
  };

  if (sessions.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
        <Text style={{ color: "#94a3b8", fontSize: 16 }}>No sessions yet</Text>
        <Text style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Connect and run diagnostics to start recording
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onExport={() => handleExport(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function SessionCard({
  session,
  onExport,
  onDelete,
}: {
  session: DiagnosticSession;
  onExport: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dtcCount = session.dtcsAtStart.length;
  const duration = session.endedAt
    ? formatDuration(session.endedAt - session.startedAt)
    : "Active";

  return (
    <View
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        style={{ padding: 14, gap: 4 }}
        accessibilityRole="button"
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "#f1f5f9", fontSize: 15, fontWeight: "600" }}>
            {session.vehicleName}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 12 }}>{duration}</Text>
        </View>
        <Text style={{ color: "#64748b", fontSize: 12 }}>
          {formatDate(session.startedAt)}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          {dtcCount > 0 && (
            <Badge
              label={`${dtcCount} DTC${dtcCount !== 1 ? "s" : ""}`}
              color="#f59e0b"
            />
          )}
          {session.dtcsCleared.length > 0 && (
            <Badge
              label={`${session.dtcsCleared.length} cleared`}
              color="#22c55e"
            />
          )}
          {Object.keys(session.diagnoses).length > 0 && (
            <Badge
              label={`${Object.keys(session.diagnoses).length} diagnosis`}
              color="#0ea5e9"
            />
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: "#334155" }}>
          {session.dtcsAtStart.length > 0 && (
            <View style={{ padding: 12, gap: 4 }}>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
                DTCs at Start
              </Text>
              {session.dtcsAtStart.map((dtc) => (
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

          {session.dtcsCleared.length > 0 && (
            <View style={{ padding: 12, paddingTop: 0, gap: 4 }}>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
                Codes Cleared
              </Text>
              {session.dtcsCleared.map((dtc) => (
                <Text key={dtc.code} style={{ color: "#22c55e", fontSize: 13 }}>
                  {dtc.code}
                </Text>
              ))}
            </View>
          )}

          <View style={{ flexDirection: "row", padding: 12, paddingTop: 0, gap: 8 }}>
            <TouchableOpacity
              onPress={onExport}
              style={{
                flex: 1,
                backgroundColor: "#334155",
                borderRadius: 8,
                padding: 8,
                alignItems: "center",
              }}
              accessibilityRole="button"
            >
              <Text style={{ color: "#94a3b8", fontSize: 13 }}>Export JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              style={{
                backgroundColor: "#ef444422",
                borderRadius: 8,
                padding: 8,
                alignItems: "center",
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: "#ef4444",
              }}
              accessibilityRole="button"
            >
              <Text style={{ color: "#ef4444", fontSize: 13 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + "22", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
