import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useDiagnosticsStore } from "../../src/store/diagnosticsStore";

function TabIcon({
  emoji,
  label,
  focused,
  badgeCount,
}: {
  emoji: string;
  label: string;
  focused: boolean;
  badgeCount?: number;
}) {
  return (
    <View style={{ alignItems: "center", paddingTop: 4 }}>
      <View style={{ position: "relative" }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
        {badgeCount !== undefined && badgeCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -8,
              backgroundColor: "#ef4444",
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
              {badgeCount > 99 ? "99+" : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{
          fontSize: 10,
          color: focused ? "#0ea5e9" : "#64748b",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const storedDTCs = useDiagnosticsStore((s) => s.storedDTCs);
  const pendingDTCs = useDiagnosticsStore((s) => s.pendingDTCs);
  const dtcCount = storedDTCs.length + pendingDTCs.length;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          height: 70,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#0ea5e9",
        tabBarInactiveTintColor: "#64748b",
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f1f5f9",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Gauges" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dtcs"
        options={{
          title: "Fault Codes",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              emoji="⚠️"
              label="Codes"
              focused={focused}
              badgeCount={dtcCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label="History" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
