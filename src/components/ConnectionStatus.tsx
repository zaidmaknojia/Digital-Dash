import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ConnectionStatus as Status } from "../transport/types";

interface Props {
  status: Status;
  adapterName?: string;
  onPress?: () => void;
}

const STATUS_CONFIG: Record<
  Status,
  { label: string; dotClass: string; textClass: string }
> = {
  connected: {
    label: "Connected",
    dotClass: "bg-success",
    textClass: "text-success",
  },
  connecting: {
    label: "Connecting...",
    dotClass: "bg-warning",
    textClass: "text-warning",
  },
  disconnected: {
    label: "Disconnected",
    dotClass: "bg-surface-600",
    textClass: "text-surface-600",
  },
  error: {
    label: "Error",
    dotClass: "bg-error",
    textClass: "text-error",
  },
};

export function ConnectionStatus({ status, adapterName, onPress }: Props) {
  const cfg = STATUS_CONFIG[status];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-2 px-3 py-2 rounded-full bg-surface-800"
      accessibilityRole="button"
      accessibilityLabel={`Connection status: ${cfg.label}`}
    >
      <View
        className={`w-2 h-2 rounded-full ${cfg.dotClass} ${
          status === "connecting" ? "animate-pulse" : ""
        }`}
      />
      <Text className={`text-xs font-medium ${cfg.textClass}`}>
        {adapterName ? `${adapterName} · ` : ""}
        {cfg.label}
      </Text>
    </TouchableOpacity>
  );
}
