/**
 * Gauge — circular arc gauge for displaying real-time PID values.
 * Pure React Native (no SVG dep) — uses View transforms for the arc needle.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";

interface GaugeProps {
  value: number;
  minValue?: number;
  maxValue: number;
  label: string;
  unit: string;
  size?: number;
  decimals?: number;
  /** Threshold above which the gauge turns red */
  warningThreshold?: number;
  /** Threshold above which the gauge turns orange */
  cautionThreshold?: number;
}

export function Gauge({
  value,
  minValue = 0,
  maxValue,
  label,
  unit,
  size = 120,
  decimals = 0,
  warningThreshold,
  cautionThreshold,
}: GaugeProps) {
  const animatedValue = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value,
      useNativeDriver: false,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [value, animatedValue]);

  const pct = Math.min(
    1,
    Math.max(0, (value - minValue) / (maxValue - minValue))
  );

  // Color based on thresholds
  let arcColor = "#0ea5e9"; // primary blue
  if (warningThreshold !== undefined && value >= warningThreshold) {
    arcColor = "#ef4444"; // error red
  } else if (cautionThreshold !== undefined && value >= cautionThreshold) {
    arcColor = "#f59e0b"; // warning amber
  }

  const displayValue =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <View
      style={{ width: size, alignItems: "center" }}
      accessibilityLabel={`${label}: ${displayValue} ${unit}`}
    >
      {/* Arc background */}
      <View
        style={{
          width: size,
          height: size * 0.6,
          borderTopLeftRadius: size / 2,
          borderTopRightRadius: size / 2,
          backgroundColor: "#1e293b",
          overflow: "hidden",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        {/* Arc fill — simple rectangle that we clip */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100%",
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${pct * 100}%`,
              backgroundColor: arcColor,
              opacity: 0.3,
            }}
          />
        </View>

        {/* Needle line */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: size / 2 - 1,
            width: 2,
            height: size * 0.5,
            backgroundColor: arcColor,
            transformOrigin: "bottom center",
            transform: [{ rotate: `${-90 + pct * 180}deg` }],
          }}
        />

        {/* Center dot */}
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: arcColor,
            marginBottom: -4,
            zIndex: 10,
          }}
        />
      </View>

      {/* Value */}
      <Text
        style={{
          color: arcColor,
          fontSize: size * 0.18,
          fontWeight: "700",
          fontVariant: ["tabular-nums"],
          marginTop: 4,
        }}
      >
        {displayValue}
      </Text>
      <Text style={{ color: "#64748b", fontSize: size * 0.1, marginTop: 1 }}>
        {unit}
      </Text>
      <Text
        style={{
          color: "#94a3b8",
          fontSize: size * 0.1,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
