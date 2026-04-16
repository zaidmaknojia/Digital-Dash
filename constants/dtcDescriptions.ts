/**
 * SAE J2012 standard DTC descriptions.
 * Manufacturer-specific codes (P1xxx, P3xxx, etc.) are not listed here —
 * AIService provides descriptions for those via LLM fallback.
 *
 * This is a representative subset of the most common codes.
 * A production app would include the full ~5,000 code database.
 */

export const DTC_DESCRIPTIONS: Record<string, string> = {
  // -------------------------------------------------------------------------
  // P0xxx — SAE Generic Powertrain
  // -------------------------------------------------------------------------

  // Fuel and Air Metering
  P0001: "Fuel Volume Regulator Control Circuit/Open",
  P0002: "Fuel Volume Regulator Control Circuit Range/Performance",
  P0003: "Fuel Volume Regulator Control Circuit Low",
  P0004: "Fuel Volume Regulator Control Circuit High",
  P0010: "Intake Camshaft Position Actuator Circuit (Bank 1)",
  P0011: "Intake Camshaft Position Timing Over-Advanced (Bank 1)",
  P0012: "Intake Camshaft Position Timing Over-Retarded (Bank 1)",
  P0013: "Exhaust Camshaft Position Actuator Circuit (Bank 1)",
  P0014: "Exhaust Camshaft Position Timing Over-Advanced (Bank 1)",
  P0015: "Exhaust Camshaft Position Timing Over-Retarded (Bank 1)",
  P0016: "Crankshaft Position/Camshaft Position Correlation (Bank 1, Sensor A)",
  P0017: "Crankshaft Position/Camshaft Position Correlation (Bank 1, Sensor B)",
  P0018: "Crankshaft Position/Camshaft Position Correlation (Bank 2, Sensor A)",
  P0019: "Crankshaft Position/Camshaft Position Correlation (Bank 2, Sensor B)",
  P0020: "Intake Camshaft Position Actuator Circuit (Bank 2)",
  P0021: "Intake Camshaft Position Timing Over-Advanced (Bank 2)",
  P0022: "Intake Camshaft Position Timing Over-Retarded (Bank 2)",

  // Injector Circuit
  P0030: "HO2S Heater Control Circuit (Bank 1, Sensor 1)",
  P0031: "HO2S Heater Control Circuit Low (Bank 1, Sensor 1)",
  P0032: "HO2S Heater Control Circuit High (Bank 1, Sensor 1)",
  P0036: "HO2S Heater Control Circuit (Bank 1, Sensor 2)",
  P0037: "HO2S Heater Control Circuit Low (Bank 1, Sensor 2)",
  P0038: "HO2S Heater Control Circuit High (Bank 1, Sensor 2)",

  // Mass Air Flow
  P0100: "Mass Air Flow Circuit Malfunction",
  P0101: "Mass Air Flow Circuit Range/Performance",
  P0102: "Mass Air Flow Circuit Low Input",
  P0103: "Mass Air Flow Circuit High Input",
  P0104: "Mass Air Flow Circuit Intermittent",

  // Intake Air Temperature
  P0110: "Intake Air Temperature Circuit Malfunction",
  P0111: "Intake Air Temperature Circuit Range/Performance",
  P0112: "Intake Air Temperature Circuit Low Input",
  P0113: "Intake Air Temperature Circuit High Input",

  // Engine Coolant Temperature
  P0115: "Engine Coolant Temperature Circuit Malfunction",
  P0116: "Engine Coolant Temperature Circuit Range/Performance",
  P0117: "Engine Coolant Temperature Circuit Low Input",
  P0118: "Engine Coolant Temperature Circuit High Input",
  P0119: "Engine Coolant Temperature Circuit Intermittent",
  P0128: "Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)",

  // Throttle Position
  P0120: "Throttle/Pedal Position Sensor A Circuit Malfunction",
  P0121: "Throttle/Pedal Position Sensor A Circuit Range/Performance",
  P0122: "Throttle/Pedal Position Sensor A Circuit Low Input",
  P0123: "Throttle/Pedal Position Sensor A Circuit High Input",
  P0124: "Throttle/Pedal Position Sensor A Circuit Intermittent",

  // O2 Sensors
  P0130: "O2 Sensor Circuit Malfunction (Bank 1, Sensor 1)",
  P0131: "O2 Sensor Circuit Low Voltage (Bank 1, Sensor 1)",
  P0132: "O2 Sensor Circuit High Voltage (Bank 1, Sensor 1)",
  P0133: "O2 Sensor Circuit Slow Response (Bank 1, Sensor 1)",
  P0134: "O2 Sensor Circuit No Activity Detected (Bank 1, Sensor 1)",
  P0135: "O2 Sensor Heater Circuit Malfunction (Bank 1, Sensor 1)",
  P0136: "O2 Sensor Circuit Malfunction (Bank 1, Sensor 2)",
  P0137: "O2 Sensor Circuit Low Voltage (Bank 1, Sensor 2)",
  P0138: "O2 Sensor Circuit High Voltage (Bank 1, Sensor 2)",
  P0139: "O2 Sensor Circuit Slow Response (Bank 1, Sensor 2)",
  P0140: "O2 Sensor Circuit No Activity Detected (Bank 1, Sensor 2)",
  P0141: "O2 Sensor Heater Circuit Malfunction (Bank 1, Sensor 2)",
  P0150: "O2 Sensor Circuit Malfunction (Bank 2, Sensor 1)",
  P0151: "O2 Sensor Circuit Low Voltage (Bank 2, Sensor 1)",
  P0152: "O2 Sensor Circuit High Voltage (Bank 2, Sensor 1)",
  P0153: "O2 Sensor Circuit Slow Response (Bank 2, Sensor 1)",
  P0154: "O2 Sensor Circuit No Activity Detected (Bank 2, Sensor 1)",
  P0155: "O2 Sensor Heater Circuit Malfunction (Bank 2, Sensor 1)",
  P0156: "O2 Sensor Circuit Malfunction (Bank 2, Sensor 2)",
  P0157: "O2 Sensor Circuit Low Voltage (Bank 2, Sensor 2)",
  P0158: "O2 Sensor Circuit High Voltage (Bank 2, Sensor 2)",
  P0159: "O2 Sensor Circuit Slow Response (Bank 2, Sensor 2)",
  P0160: "O2 Sensor Circuit No Activity Detected (Bank 2, Sensor 2)",
  P0161: "O2 Sensor Heater Circuit Malfunction (Bank 2, Sensor 2)",

  // Fuel System
  P0170: "Fuel Trim Malfunction (Bank 1)",
  P0171: "System Too Lean (Bank 1)",
  P0172: "System Too Rich (Bank 1)",
  P0173: "Fuel Trim Malfunction (Bank 2)",
  P0174: "System Too Lean (Bank 2)",
  P0175: "System Too Rich (Bank 2)",

  // Misfire
  P0300: "Random/Multiple Cylinder Misfire Detected",
  P0301: "Cylinder 1 Misfire Detected",
  P0302: "Cylinder 2 Misfire Detected",
  P0303: "Cylinder 3 Misfire Detected",
  P0304: "Cylinder 4 Misfire Detected",
  P0305: "Cylinder 5 Misfire Detected",
  P0306: "Cylinder 6 Misfire Detected",
  P0307: "Cylinder 7 Misfire Detected",
  P0308: "Cylinder 8 Misfire Detected",

  // Knock Sensor
  P0325: "Knock Sensor 1 Circuit Malfunction (Bank 1)",
  P0326: "Knock Sensor 1 Circuit Range/Performance (Bank 1)",
  P0327: "Knock Sensor 1 Circuit Low Input (Bank 1)",
  P0328: "Knock Sensor 1 Circuit High Input (Bank 1)",
  P0330: "Knock Sensor 2 Circuit Malfunction (Bank 2)",
  P0331: "Knock Sensor 2 Circuit Range/Performance (Bank 2)",

  // Crankshaft/Camshaft Position Sensor
  P0335: "Crankshaft Position Sensor A Circuit Malfunction",
  P0336: "Crankshaft Position Sensor A Circuit Range/Performance",
  P0337: "Crankshaft Position Sensor A Circuit Low Input",
  P0338: "Crankshaft Position Sensor A Circuit High Input",
  P0340: "Camshaft Position Sensor Circuit Malfunction (Bank 1)",
  P0341: "Camshaft Position Sensor Circuit Range/Performance (Bank 1)",
  P0342: "Camshaft Position Sensor Circuit Low Input (Bank 1)",
  P0343: "Camshaft Position Sensor Circuit High Input (Bank 1)",
  P0344: "Camshaft Position Sensor Circuit Intermittent (Bank 1)",
  P0345: "Camshaft Position Sensor Circuit Malfunction (Bank 2)",

  // Ignition System
  P0351: "Ignition Coil A Primary/Secondary Circuit Malfunction",
  P0352: "Ignition Coil B Primary/Secondary Circuit Malfunction",
  P0353: "Ignition Coil C Primary/Secondary Circuit Malfunction",
  P0354: "Ignition Coil D Primary/Secondary Circuit Malfunction",
  P0355: "Ignition Coil E Primary/Secondary Circuit Malfunction",
  P0356: "Ignition Coil F Primary/Secondary Circuit Malfunction",
  P0357: "Ignition Coil G Primary/Secondary Circuit Malfunction",
  P0358: "Ignition Coil H Primary/Secondary Circuit Malfunction",

  // Fuel Injectors
  P0370: "Timing Reference High Resolution Signal A Malfunction",
  P0380: "Glow Plug/Heater Circuit Malfunction (Bank 1)",
  P0381: "Glow Plug/Heater Indicator Circuit Malfunction",

  // Vehicle Speed / Idle Control
  P0400: "Exhaust Gas Recirculation Flow Malfunction",
  P0401: "Exhaust Gas Recirculation Flow Insufficient Detected",
  P0402: "Exhaust Gas Recirculation Flow Excessive Detected",
  P0403: "Exhaust Gas Recirculation Circuit Malfunction",
  P0404: "Exhaust Gas Recirculation Circuit Range/Performance",
  P0405: "Exhaust Gas Recirculation Sensor A Circuit Low",
  P0406: "Exhaust Gas Recirculation Sensor A Circuit High",
  P0410: "Secondary Air Injection System Malfunction",
  P0411: "Secondary Air Injection System Incorrect Flow Detected",
  P0420: "Catalyst System Efficiency Below Threshold (Bank 1)",
  P0421: "Warm Up Catalyst Efficiency Below Threshold (Bank 1)",
  P0422: "Main Catalyst Efficiency Below Threshold (Bank 1)",
  P0430: "Catalyst System Efficiency Below Threshold (Bank 2)",
  P0431: "Warm Up Catalyst Efficiency Below Threshold (Bank 2)",
  P0432: "Main Catalyst Efficiency Below Threshold (Bank 2)",

  // EVAP
  P0440: "Evaporative Emission Control System Malfunction",
  P0441: "Evaporative Emission Control System Incorrect Purge Flow",
  P0442: "Evaporative Emission Control System Leak Detected (Small Leak)",
  P0443: "Evaporative Emission Control System Purge Control Valve Circuit",
  P0444: "Evaporative Emission Control System Purge Control Valve Circuit Open",
  P0445: "Evaporative Emission Control System Purge Control Valve Circuit Shorted",
  P0446: "Evaporative Emission Control System Vent Control Circuit",
  P0447: "Evaporative Emission Control System Vent Control Circuit Open",
  P0448: "Evaporative Emission Control System Vent Control Circuit Shorted",
  P0449: "Evaporative Emission Control System Vent Valve/Solenoid Circuit",
  P0450: "Evaporative Emission Control System Pressure Sensor Malfunction",
  P0451: "Evaporative Emission Control System Pressure Sensor Range/Performance",
  P0452: "Evaporative Emission Control System Pressure Sensor Low Input",
  P0453: "Evaporative Emission Control System Pressure Sensor High Input",
  P0455: "Evaporative Emission Control System Leak Detected (Gross Leak)",
  P0456: "Evaporative Emission Control System Leak Detected (Very Small Leak)",
  P0457: "Evaporative Emission Control System Leak Detected (Fuel Cap Loose/Off)",

  // Speed Control
  P0500: "Vehicle Speed Sensor Malfunction",
  P0501: "Vehicle Speed Sensor Range/Performance",
  P0502: "Vehicle Speed Sensor Circuit Low Input",
  P0503: "Vehicle Speed Sensor Intermittent/Erratic/High",
  P0505: "Idle Control System Malfunction",
  P0506: "Idle Control System RPM Lower Than Expected",
  P0507: "Idle Control System RPM Higher Than Expected",

  // Transmission / Torque Converter
  P0700: "Transmission Control System Malfunction",
  P0710: "Transmission Fluid Temperature Sensor Circuit Malfunction",
  P0711: "Transmission Fluid Temperature Sensor Circuit Range/Performance",
  P0712: "Transmission Fluid Temperature Sensor Circuit Low Input",
  P0713: "Transmission Fluid Temperature Sensor Circuit High Input",
  P0715: "Input/Turbine Speed Sensor Circuit Malfunction",
  P0720: "Output Speed Sensor Circuit Malfunction",
  P0730: "Incorrect Gear Ratio",
  P0731: "Gear 1 Incorrect Ratio",
  P0732: "Gear 2 Incorrect Ratio",
  P0733: "Gear 3 Incorrect Ratio",
  P0734: "Gear 4 Incorrect Ratio",
  P0740: "Torque Converter Clutch Circuit Malfunction",
  P0741: "Torque Converter Clutch Circuit Performance or Stuck Off",
  P0742: "Torque Converter Clutch Circuit Stuck On",
  P0750: "Shift Solenoid A Malfunction",
  P0755: "Shift Solenoid B Malfunction",
  P0760: "Shift Solenoid C Malfunction",
  P0765: "Shift Solenoid D Malfunction",

  // -------------------------------------------------------------------------
  // B-codes — Body
  // -------------------------------------------------------------------------
  B0001: "Driver Frontal Stage 1 Deployment Control",
  B0002: "Driver Frontal Stage 2 Deployment Control",
  B1000: "Electronic Crash Sensor Assembly Internal Fault",

  // -------------------------------------------------------------------------
  // C-codes — Chassis
  // -------------------------------------------------------------------------
  C0031: "Right Front Wheel Speed Sensor Circuit",
  C0032: "Right Front Wheel Speed Sensor Circuit Range/Performance",
  C0034: "Left Front Wheel Speed Sensor Circuit",
  C0035: "Left Front Wheel Speed Sensor Circuit Range/Performance",
  C0036: "Right Rear Wheel Speed Sensor Circuit",
  C0037: "Right Rear Wheel Speed Sensor Circuit Range/Performance",
  C0040: "Left Rear Wheel Speed Sensor Circuit",
  C0041: "Left Rear Wheel Speed Sensor Circuit Range/Performance",

  // -------------------------------------------------------------------------
  // U-codes — Network
  // -------------------------------------------------------------------------
  U0001: "High Speed CAN Communication Bus",
  U0002: "High Speed CAN Communication Bus Performance",
  U0010: "Medium Speed CAN Communication Bus",
  U0073: "Control Module Communication Bus Off",
  U0100: "Lost Communication With ECM/PCM",
  U0101: "Lost Communication With TCM",
  U0121: "Lost Communication With Anti-Lock Brake System (ABS) Control Module",
  U0155: "Lost Communication With Instrument Panel Cluster (IPC) Control Module",
};
