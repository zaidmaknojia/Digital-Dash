/**
 * Default PID polling configuration for the dashboard.
 * Keys are PID names from PIDRegistry, values are polling frequencies in Hz.
 */

export const DEFAULT_DASHBOARD_PIDS: Record<string, number> = {
  RPM: 5,
  SPEED: 5,
  ENGINE_LOAD: 2,
  COOLANT_TEMP: 0.5,
  THROTTLE: 5,
  MAF_RATE: 2,
  INTAKE_TEMP: 0.5,
  FUEL_LEVEL: 0.1,
  CONTROL_MODULE_VOLTAGE: 0.2,
  OIL_TEMP: 0.2,
  TIMING_ADVANCE: 2,
  INTAKE_PRESSURE: 2,
  BARO_PRESSURE: 0.1,
};

/** PIDs that are considered high-priority (shown prominently on dashboard) */
export const PRIORITY_PIDS = ["RPM", "SPEED", "COOLANT_TEMP", "ENGINE_LOAD"];

/** PIDs that indicate potential engine problems if out of range */
export const WATCHDOG_THRESHOLDS: Record<
  string,
  { min?: number; max?: number; label: string }
> = {
  COOLANT_TEMP: { max: 105, label: "Engine overheating" },
  OIL_TEMP: { max: 135, label: "Oil overheating" },
  CONTROL_MODULE_VOLTAGE: { min: 11.5, max: 15.5, label: "Battery voltage abnormal" },
  ENGINE_LOAD: { max: 95, label: "Extreme engine load" },
};
