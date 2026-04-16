import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { PID_DEFINITIONS } from "../obd2/PIDRegistry";

interface Props {
  selected: string[];
  onToggle: (pidName: string) => void;
  maxSelected?: number;
}

export function PIDSelector({ selected, onToggle, maxSelected = 8 }: Props) {
  const isSelected = (name: string) => selected.includes(name);
  const canAdd = selected.length < maxSelected;

  return (
    <FlatList
      data={PID_DEFINITIONS}
      keyExtractor={(item) => item.name}
      numColumns={2}
      contentContainerStyle={{ padding: 8, gap: 6 }}
      columnWrapperStyle={{ gap: 6 }}
      renderItem={({ item }) => {
        const sel = isSelected(item.name);
        return (
          <TouchableOpacity
            onPress={() => (sel || canAdd) && onToggle(item.name)}
            disabled={!sel && !canAdd}
            style={{
              flex: 1,
              backgroundColor: sel ? "#0ea5e9" : "#1e293b",
              borderRadius: 8,
              padding: 10,
              opacity: !sel && !canAdd ? 0.4 : 1,
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: sel }}
            accessibilityLabel={`${item.name}: ${item.unit}`}
          >
            <Text
              style={{
                color: sel ? "#fff" : "#94a3b8",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {item.name.replace(/_/g, " ")}
            </Text>
            <Text style={{ color: sel ? "#bae6fd" : "#475569", fontSize: 10 }}>
              {item.unit}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}
